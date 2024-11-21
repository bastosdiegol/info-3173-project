import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  Button,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { firestore } from "../FirebaseConfig";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { auth } from "../FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function UserManager({ navigation }) {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(["", "Staff", "Supervisor"]);

  /**
   * @function useEffect
   * @description Load the users from Firestore
   * @returns {void}
   */
  useEffect(() => {
    // Define the Firestore query with ordering
    const collectionQuery = query(
      collection(firestore, "users"),
      orderBy("role", "desc"),
      orderBy("firstname"),
      orderBy("lastname")
    );

    // Subscribe to the query
    const unsubscribe = onSnapshot(collectionQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      console.log("Ordered Firebase Data:", usersData);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * @function addUser
   * @description Add a new user to Firebase Auth and Firestore
   * @returns {void}
   */
  const addUser = async () => {
    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("User created in Firebase Auth with UID: ", user.uid);

      // Add the user's data to Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        firstname: firstname,
        lastname: lastname,
        email: user.email,
        role: role,
      });

      console.log("User added to Firestore with UID: ", user.uid);
    } catch (error) {
      console.error("Error adding user: ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <FontAwesome name="users" size={24} color="black" />
        <Text style={styles.headerTitle}>Registred Users</Text>
      </View>
      <ScrollView style={styles.scrollContainer}>
        {users.map((user, index) => (
          <View style={styles.registredUser} key={index}>
            <Text style={styles.column}>
              {user.firstname} {user.lastname}
            </Text>
            <Text style={styles.column}>{user.role}</Text>
            <FontAwesome name="gear" size={24} color="black" />
          </View>
        ))}
      </ScrollView>
      <View style={styles.paddedSection}>
        <View style={styles.headerRow}>
          <FontAwesome name="user-plus" size={24} color="black" />
          <Text style={styles.headerTitle}>Add New User</Text>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Firstname</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setFirstname(text)}
            value={firstname}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Lastname</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setLastname(text)}
            value={lastname}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setEmail(text)}
            value={email}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry={true}
            onChangeText={(text) => setPassword(text)}
            value={password}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Role</Text>
          <Picker
            selectedValue={role}
            style={styles.input}
            onValueChange={(itemValue) => setRole(itemValue)}
          >
            {roles.map((role, index) => (
              <Picker.Item key={index} label={role} value={role} />
            ))}
          </Picker>
        </View>

        <Button title="Add User" onPress={addUser} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    width: "100%",
  },
  registredUser: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  column: {
    flex: 1,
    fontSize: 16,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    alignSelf: "center",
    fontWeight: "bold",
  },
  text: {
    fontSize: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  label: {
    width: 100,
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#000",
    flex: 1,
    padding: 5,
    fontSize: 16,
    borderRadius: 5,
  },
  line: {
    height: 1,
    backgroundColor: "black",
    width: "100%",
    marginVertical: 10,
  },
  paddedSection: {
    width: "100%",
    padding: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    borderRadius: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
