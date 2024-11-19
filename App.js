import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./components/Home";
import UserManager from "./components/UserManager";
import CreateItem from "./components/CreateItem";
import { db, firestore, auth } from "./FirebaseConfig";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen
          name="UserManager"
          component={UserManager}
          options={{ title: "User Management" }}
        />
        <Stack.Screen
          name="CreateItem"
          component={CreateItem}
          options={{ title: "Add New Item" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
