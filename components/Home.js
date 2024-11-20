import { useState, useEffect } from "react";
import { View, TextInput, Text, Button, StyleSheet, Alert } from "react-native";
import { auth, firestore } from "../FirebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as FileSystem from "expo-file-system";

export default function Home({ navigation }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      await checkUserRole();
    };
    fetchUserRole();
    // readBackupData();
  }, []);

  /**
   * @function loginWithFirebase
   * @description Log in the user with firebase
   * @returns {void}
   */
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

  /**
   * @function logoutWithFirebase
   * @description Log out the current user
   * @returns {void}
   */
  const logoutWithFirebase = () => {
    auth.signOut().then(function () {
      Alert.alert("Logout Successful!");
      setLoggedIn(false);
    });
  };

  /**
   * @function checkUserRole
   * @description Check if the current user is a supervisor
   * @throws {Error} If there is an error checking the user role
   * @returns {Promise<void>}
   */
  const checkUserRole = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      const userData = userDoc.data();

      setIsSupervisor(userData?.role === "Supervisor");
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  /**
   * @function handleBackupData
   * @description Backup the Firestore data to a local file
   * @throws {Error} If there is an error backing up the data
   * @returns {Promise<void>}
   */
  const handleBackupData = async () => {
    try {
      const backupData = {};

      // Helper function to process complex fields (like objects or arrays)
      const processDataFields = (data) => {
        if (Array.isArray(data)) {
          return data.map((item) => processDataFields(item)); // Recursively process arrays
        } else if (typeof data === "object" && data !== null) {
          // Recursively process objects
          const processedObject = {};
          for (const [key, value] of Object.entries(data)) {
            processedObject[key] = processDataFields(value); // Process nested values
          }
          return processedObject;
        }
        return data; // Return the data as is if it's a primitive value
      };

      // Backup Items
      let querySnapshot = await getDocs(collection(firestore, "items"));
      let firestoreData = [];
      querySnapshot.forEach((doc) => {
        let itemData = { id: doc.id, ...doc.data() };
        itemData = processDataFields(itemData); // Process any complex fields in the data
        firestoreData.push(itemData);
      });
      backupData.items = firestoreData;

      // Backup Users
      querySnapshot = await getDocs(collection(firestore, "users"));
      firestoreData = [];
      querySnapshot.forEach((doc) => {
        let userData = { id: doc.id, ...doc.data() };
        userData = processDataFields(userData); // Process any complex fields in the data
        firestoreData.push(userData);
      });
      backupData.users = firestoreData;

      // Convert backup data to JSON string
      const backupDataString = JSON.stringify(backupData);

      // Save data to file locally
      const path = FileSystem.documentDirectory + "firestore_backup.json";
      await FileSystem.writeAsStringAsync(path, backupDataString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log("Backup successful! Data saved at:", path);
    } catch (error) {
      console.error("Error backing up data:", error);
    }
  };

  /**
   * @function readBackupData
   * @description Read the backup data from the local file
   * @throws {Error} If there is an error reading the backup data
   * @returns {Promise<void>}
   */
  const readBackupData = async () => {
    try {
      // Define the path to the backup file
      const path = FileSystem.documentDirectory + "firestore_backup.json";

      // Read the file content as a string
      const backupDataString = await FileSystem.readAsStringAsync(path, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Parse the string to JSON
      const backupData = JSON.parse(backupDataString);

      // Log the backup data
      console.log("Backup Data:", backupData);
    } catch (error) {
      console.error("Error reading backup data:", error);
    }
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
          <Button
            title="Inventory Management"
            onPress={() => navigation.navigate("InventoryManager")}
          />
          {isSupervisor && (
            <Button title="Backup Data" onPress={handleBackupData} />
          )}
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
