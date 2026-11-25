import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import type { ReactNode } from "react";
import { useSoundEffects } from "./SoundEffectsProvider";

type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
};

export function ModalSheet({
  visible,
  onClose,
  children,
  scrollable = false,
  contentStyle,
}: ModalSheetProps) {
  const playSound = useSoundEffects();
  const closeWithSound = () => {
    playSound("tap");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeWithSound}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeWithSound} />
        <View style={[styles.sheet, contentStyle]}>
          <View style={styles.handle} />
          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.content}>{children}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.82)",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: "#080808",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#292929",
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
    alignSelf: "center",
    marginTop: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
});
