import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { Transcript } from '../models/Transcript';
import { Meeting } from '../models/Meeting';
import { Participant } from '../models/Participant';
import { Mail } from '../models/Mail';
import { User } from '../models/User';
import { sendPushNotification } from './pushNotifications';
import { sendWebPush } from './webPush';

let genAI: GoogleGenerativeAI | null = null;
let fileManager: GoogleAIFileManager | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
}
export async function dispatchSummaryMail(meeting: any, summaryHtml: string) {
  try {
    // Get all users who participated in this meeting via the Participant collection
    const participantDocs = await Participant.find({ meetingId: meeting._id }).distinct('userId');

    // Also include the host
    const allUserIds = [...new Set([...participantDocs.map((id: any) => id.toString()), meeting.hostId?.toString()])].filter(Boolean);

    const users = await User.find({
      _id: { $in: allUserIds },
      email: { $ne: 'ai-assistant@nexus.app' } // exclude the bot itself
    });

    if (users.length === 0) {
      console.warn('[Summarizer] No human participants found  skipping mail dispatch.');
      return;
    }

    const recipientEmails = users.map((u: any) => u.email);

    const mailDoc = {
      workspaceId: 'forge-india-connect',
      senderName: 'Forge India Connect AI',
      senderEmail: 'ai-assistant@nexus.app',
      recipientEmails,
      subject: ` Meeting Summary: ${meeting.title}`,
      body: summaryHtml,
      isRead: false,
      isStarred: false,
      sentAt: new Date()
    };

    // Create Sent copy for AI Bot
    await Mail.create({ ...mailDoc, ownerEmail: 'ai-assistant@nexus.app', folder: 'sent' });

    // Create Inbox copy for each participant
    for (const email of recipientEmails) {
      try {
        const summaryMail = await Mail.create({ ...mailDoc, ownerEmail: email, folder: 'inbox' });

        // Trigger WebSocket broadcast for real-time visual toasts
        const { activeMailSockets } = require('./mailSockets');
        if (activeMailSockets && activeMailSockets.has(email)) {
          const ws = activeMailSockets.get(email);
          if (ws?.readyState === 1) {
            ws.send(JSON.stringify({ type: 'NEW_MAIL', mail: summaryMail }));
          }
        }

        // Trigger remote push notification for background/terminated devices
        sendPushNotification(
          [email],
          `New Email: Meeting Summary: ${meeting.title}`,
          `From: Forge India Connect AI`,
          {
            type: 'mail',
            mailId: summaryMail._id.toString(),
            senderEmail: 'ai-assistant@nexus.app',
          }
        ).catch((err: any) => console.error('[Summarizer] Push error:', err));

        // Trigger Web Push notification for closed-tab browser state
        sendWebPush(
          [email],
          {
            title: `New Email: Meeting Summary: ${meeting.title}`,
            body: `From: Forge India Connect AI`,
            url: `/w/${meeting.workspaceId || 'forge-india-connect'}/mail`
          }
        ).catch((err: any) => console.error('[Summarizer] Web push error:', err));
      } catch (e) {
        console.error('[Summarizer] Failed to dispatch summary mail notifications for', email, e);
      }
    }

    console.log(`[Summarizer]  Summary mail dispatched to ${recipientEmails.length} participant(s): ${recipientEmails.join(', ')}`);
  } catch (err: any) {
    console.error('[Summarizer] Mail dispatch failed:', err.message);
  }
}

export async function summarizeMeeting(meetingId: string) {
  console.log(`[Summarizer] Starting summarization for meeting ${meetingId}`);

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    console.warn('[Summarizer] Meeting not found:', meetingId);
    return null;
  }

  // Don't re-summarize if already done
  if (meeting.aiSummary) {
    console.log('[Summarizer] Summary already exists, skipping.');
    return meeting.aiSummary;
  }

  // Deduplication guard: prevent sending summary email more than once
  if (meeting.summarySent) {
    console.log('[Summarizer] Summary email already sent for this meeting, skipping.');
    return meeting.aiSummary || null;
  }

  // Atomically set summarySent to prevent race conditions (multiple leave events)
  const lockResult = await Meeting.findOneAndUpdate(
    { _id: meetingId, summarySent: { $ne: true } },
    { $set: { summarySent: true } },
    { new: true }
  );
  if (!lockResult) {
    console.log('[Summarizer] Another process already claimed this summary, skipping.');
    return null;
  }

  const tmpDir = os.tmpdir();
  const audioFilePath = path.join(tmpDir, `meeting_audio_${meetingId}.webm`);
  const hasAudioFile = fs.existsSync(audioFilePath);

  let summaryHtml: string;

  if (!hasAudioFile || !process.env.GEMINI_API_KEY || !genAI || !fileManager) {
    // No audio file or no API key / Gemini client -> send a "meeting completed" notification instead
    console.log(`[Summarizer] No audio file found (or no API key/client). Sending completion notification.`);
    let duration = 0;
    if (meeting.scheduledAt) {
      duration = Math.max(1, Math.round((Date.now() - new Date(meeting.scheduledAt).getTime()) / 60000));
    }

    summaryHtml = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px">
  <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:24px;border-radius:8px;margin-bottom:20px">
    <h1 style="color:#fff;margin:0;font-size:22px"> Meeting Completed</h1>
    <p style="color:#bfdbfe;margin:8px 0 0">${meeting.title}</p>
  </div>
  <div style="background:#fff;padding:20px;border-radius:8px;border:1px solid #e2e8f0">
    <h2 style="color:#1e293b;margin-top:0">Meeting Details</h2>
    <ul style="color:#475569;line-height:1.8">
      <li><strong>Title:</strong> ${meeting.title}</li>
      <li><strong>Duration:</strong> ~${duration} minutes</li>
      <li><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</li>
      <li><strong>Status:</strong> Completed</li>
    </ul>
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin-top:16px;border-radius:4px">
      <p style="margin:0;color:#92400e;font-size:14px">
        <strong>Note:</strong> No audio transcript was captured for this meeting. 
        To receive full AI-generated summaries, ensure your microphone is active and AI Assistant is enabled when the meeting starts.
      </p>
    </div>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px">Sent by Forge India Connect AI</p>
</div>`;
  } else {
    // We have an audio file -> generate AI summary using Gemini
    console.log(`[Summarizer] Summarizing audio file ${audioFilePath}...`);

    const prompt = `You are an expert Executive Assistant. Summarize the provided meeting audio.
The audio may contain a mix of English and Tamil.
Your summary MUST be entirely in English.
Your response MUST be formatted in clean HTML suitable for an email body.
Do NOT use markdown. Use bold tags, lists, and headers (h2, h3).
Do NOT use a predefined rigid template. Dynamically analyze the meeting context and generate appropriate sections (e.g. Executive Summary, Main Discussion Points, Key Takeaways, Action Items, Ideas, etc.) based ONLY on what was actually discussed.
Focus on capturing the real essence of the conversation accurately.`;

    let uploadedFile: any = null;
    try {
      // Upload the file to Gemini
      console.log('[Summarizer] Uploading audio to Gemini...');
      uploadedFile = await fileManager.uploadFile(audioFilePath, {
        mimeType: 'audio/webm',
        displayName: `meeting_audio_${meetingId}`,
      });

      console.log(`[Summarizer] Uploaded to Gemini: ${uploadedFile.file.uri}`);

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      console.log('[Summarizer] Requesting generation...');
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadedFile.file.mimeType,
            fileUri: uploadedFile.file.uri
          }
        },
        { text: prompt },
      ]);

      const rawSummary = result.response.text() || '';
      let duration = meeting.durationMinutes || 60;
      if (meeting.scheduledAt) {
        duration = Math.max(1, Math.round((Date.now() - new Date(meeting.scheduledAt).getTime()) / 60000));
      }

      // Extract unique speakers from Participant collection
      const uniqueSpeakers = await Participant.countDocuments({ meetingId });

      // Wrap the raw AI summary in our premium Forge India email design
      summaryHtml = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px">
  <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:24px;border-radius:8px;margin-bottom:20px">
    <h1 style="color:#fff;margin:0;font-size:22px">Meeting Summary</h1>
    <p style="color:#bfdbfe;margin:8px 0 0">${meeting.title}</p>
  </div>
  
  <div style="background:#fff;padding:20px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px">
    <h2 style="color:#1e293b;margin-top:0;font-size:16px;margin-bottom:12px">Meeting Details</h2>
    <ul style="color:#475569;line-height:1.8;margin:0;padding-left:20px">
      <li><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</li>
      <li><strong>Duration:</strong> ~${duration} minutes</li>
      <li><strong>Speakers:</strong> ${uniqueSpeakers}</li>
    </ul>
  </div>

  <div style="background:#fff;padding:24px;border-radius:8px;border:1px solid #e2e8f0;color:#1e293b;line-height:1.6">
    ${rawSummary
      .replace(/<h2>/g, '<h2 style="color:#1e40af;font-size:18px;margin-top:24px;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:8px">')
      .replace(/<h3>/g, '<h3 style="color:#334155;font-size:16px;margin-top:20px;margin-bottom:8px">')
      .replace(/<ul>/g, '<ul style="color:#475569;padding-left:20px;margin-bottom:16px">')
      .replace(/<li>/g, '<li style="margin-bottom:8px">')
    }
  </div>
  
  <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px">Sent by Forge India Connect AI</p>
</div>`;
      
      console.log(`[Summarizer] AI summary generated and formatted.`);
    } catch (err: any) {
      console.error('[Summarizer] Gemini API failed:', err.message);
      return null;
    } finally {
      // Clean up uploaded file from Gemini to save space
      if (uploadedFile && fileManager) {
        try {
          await fileManager.deleteFile(uploadedFile.file.name);
          console.log(`[Summarizer] Deleted ${uploadedFile.file.name} from Gemini API`);
        } catch (e) {
          console.warn('[Summarizer] Failed to delete file from Gemini API', e);
        }
      }
      // Delete local temporary audio file
      try {
        fs.unlinkSync(audioFilePath);
        console.log(`[Summarizer] Deleted local file ${audioFilePath}`);
      } catch (e) {
        console.warn('[Summarizer] Failed to delete local audio file', e);
      }
    }
  }

  if (summaryHtml) {
    // Save summary to meeting record
    await Meeting.findByIdAndUpdate(meetingId, { aiSummary: summaryHtml });

    // Send mail to all participants
    await dispatchSummaryMail(meeting, summaryHtml);
  }

  return summaryHtml;
}
