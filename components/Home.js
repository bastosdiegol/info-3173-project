import { useState } from "react";
import { View, TextInput, Text, Button, StyleSheet, Alert } from "react-native";
import { auth } from "../FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function Home({ navigation }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const loginWithFirebase = () => {
    if (loginEmail.length < 4) {
      Alert.alert("Please enter an email address.");
      return;
    }

    if (loginPassword.length < 4) {
      Alert.alert("Please enter a password.");
      return;
    }

    signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      .then(function (_firebaseUser) {
        Alert.alert("Login Successful!");
        setLoggedIn(true);
        navigation.navigate("Home");
      })
      .catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        if (errorCode === "auth/wrong-password") {
          Alert.alert("Wrong password.");
        } else {
          Alert.alert(errorMessage);
        }
      });
  };

  const logoutWithFirebase = () => {
    auth.signOut().then(function () {
      Alert.alert("Logout Successful!");
      setLoggedIn(false);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <FontAwesome name="list" size={24} color="black" style={styles.icon} />
        <Text style={styles.title}>Business Inventory</Text>
      </View>
      <Text style={styles.title}>A Firebase App</Text>
      {!loggedIn && (
        <View style={styles.form}>
          <Text style={styles.label}>Sign In</Text>
          <TextInput
            style={styles.input}
            onChangeText={(value) => setLoginEmail(value)}
            autoCapitalize="none"
            autoCorrect={false}
            autoCompleteType="email"
            keyboardType="email-address"
            placeholder="Email"
          />
          <TextInput
            style={styles.input}
            onChangeText={(value) => setLoginPassword(value)}
            autoCapitalize="none"
            autoCorrect={false}
            autoCompleteType="password"
            placeholder="Password"
            secureTextEntry={true}
          />
          <View style={styles.buttonContainer}>
            <Button title="Login" onPress={loginWithFirebase} />
          </View>
        </View>
      )}
      {loggedIn && (
        <View style={styles.buttonContainer}>
          <Button
            title="User Management"
            onPress={() => navigation.navigate("UserManager")}
          />
          <Button
            title="Add New Item"
            onPress={() => navigation.navigate("CreateItem")}
          />
          <Button title="Logout" onPress={logoutWithFirebase} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    textAlign: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
    marginTop: 4,
  },
  form: {
    width: "100%",
    maxWidth: 400,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 15,
    fontSize: 18,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  buttonContainer: {
    width: "100%",
    marginVertical: 20,
    gap: 20,
  },
});
