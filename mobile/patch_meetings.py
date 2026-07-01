import os

file_path = r"d:\New folder\mobile\src\pages\Meetings.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace("ViewStyle, DeviceEventEmitter,", "ViewStyle, DeviceEventEmitter, Animated, PanResponder,")
content = content.replace("import RenderHtml from 'react-native-render-html';", "import RenderHtml from 'react-native-render-html';\nimport { useLocation } from '../lib/router';")

# 2. PiP State
state_logic = """
  const [userToggledMinimize, setUserToggledMinimize] = React.useState(false);
  const location = useLocation();
  const isMeetingsRoute = location.pathname.startsWith('/meetings');
  const isMinimized = !isMeetingsRoute || userToggledMinimize;

  const PIP_WIDTH = 120;
  const PIP_HEIGHT = 160;
  const pan = React.useRef(new Animated.ValueXY({ x: width - PIP_WIDTH - 20, y: height - PIP_HEIGHT - 100 })).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    })
  ).current;

  React.useEffect(() => {
    if (!activeRoom) {
      setUserToggledMinimize(false);
      pan.setValue({ x: width - PIP_WIDTH - 20, y: height - PIP_HEIGHT - 100 });
      pan.flattenOffset();
    }
  }, [activeRoom]);
"""
content = content.replace("  // Form fields", state_logic + "\n  // Form fields")

# 3. Add minimize button to top right
minimize_btn = """
            <TouchableOpacity onPress={() => setUserToggledMinimize(true)} style={{ marginRight: 16 }}>
              <Minimize2 size={22} color="#fff" />
            </TouchableOpacity>
"""
content = content.replace("<View style={s.roomTopRight}>", "<View style={s.roomTopRight}>\n" + minimize_btn)


# 4. Refactor returns
# Part A: const RoomView = ...
content = content.replace(
"""    return (
      <View style={s.roomRoot}>
        <StatusBar hidden />""",
"""    let RoomView = null;
    RoomView = (
      <View style={[s.roomRoot, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }]}>
        <StatusBar hidden />"""
)

# Part B: end of active room block
content = content.replace(
"""        {renderHostControlsModal()}
      </View>
    );
  }

  //  MEETINGS HOME SCREEN 
  return (""",
"""        {renderHostControlsModal()}
      </View>
    );
  }

  //  MEETINGS HOME SCREEN 
  const BackgroundView = isMeetingsRoute ? ("""
)

# Part C: end of file return replacement
old_end = """        </ScrollView>
      </View>
    );
}"""

new_end = """        </ScrollView>
      </View>
    );

  if (!isMeetingsRoute && !activeRoom) return null;

  return (
    <>
      {BackgroundView}
      {activeRoom && (
        isMinimized ? (
          <Animated.View style={[{
              position: 'absolute',
              width: PIP_WIDTH,
              height: PIP_HEIGHT,
              backgroundColor: '#111827',
              borderRadius: 12,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
              zIndex: 99999,
            }, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
            <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }} onPress={() => setUserToggledMinimize(false)}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' }}>
                <Video size={32} color="#3b82f6" />
                <Text style={{ color: '#fff', fontSize: 10, marginTop: 8, fontWeight: '700' }} numberOfLines={1}>{activeRoom.title || 'Meeting'}</Text>
                <Text style={{ color: '#ef4444', fontSize: 9, marginTop: 4 }}>Tap to expand</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          RoomView
        )
      )}
    </>
  );
}"""

content = content.replace(old_end, new_end)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched successfully.")
