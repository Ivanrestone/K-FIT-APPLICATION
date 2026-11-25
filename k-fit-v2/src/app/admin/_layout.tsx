import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AdminHeader } from "../../components/headers/AdminHeader";
import { AdminBottomNav } from "../../components/navigation/AdminBottomNav";

const Theme = {
  background: "#080808",
};

export default function AdminLayout() {
  return (
    <View style={styles.container}>
      <AdminHeader />
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Theme.background },
          }}
        />
      </View>
      <AdminBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    flex: 1,
  },
});
