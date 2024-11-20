import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Button,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { firestore, auth } from "../FirebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import * as MailComposer from "expo-mail-composer";
import * as SMS from "expo-sms";

export default function InventoryManager({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadInventoryFromFirebase();
    checkUserRole();
  }, []);

  /**
   * @function loadInventoryFromFirebase
   * @description Load the inventory items from Firestore
   * @returns {Promise<void>}
   */
  const loadInventoryFromFirebase = async () => {
    try {
      const inventoryCollection = collection(firestore, "items");
      const snapshot = await getDocs(inventoryCollection);
      const inventoryArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInventory(inventoryArray);
    } catch (error) {
      console.error("Error loading inventory:", error);
      setInventory([]);
    }
  };

  /**
   * @function updateItemQuantity
   * @description Update the quantity of an item in Firestore
   * @param {string} itemId - The ID of the item to update
   * @param {number} newQuantity - The new quantity of the item
   * @returns {Promise<void>}
   */
  const updateItemQuantity = async (itemId, newQuantity) => {
    try {
      const itemRef = doc(firestore, "items", itemId);
      await updateDoc(itemRef, { quantity: newQuantity });
      let item = inventory.find((item) => item.id === itemId);

      // Update the local state
      setInventory((prevInventory) =>
        prevInventory.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      // Suggest reordering if the quantity is below 5
      if (newQuantity < 5) {
        Alert.alert(
          "Low Inventory Warning",
          `The quantity of item ${item.name} is low. Would you like to reorder?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Reorder",
              onPress: () => sendReorderSMS(item, newQuantity),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error updating item quantity:", error);
    }
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
   * @function sendReorderEmail
   * @description Send an email to the procurement team to reorder an item
   * @param {object} item - The item to reorder
   * @param {number} quantity - The new quantity of the item
   * @returns {void}
   */
  const sendReorderEmail = async (item, quantity) => {
    const isAvailable = await MailComposer.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert("Email is not available on this device.");
      return;
    }

    var options = {
      recipients: ["procurement@business.com"],
      ccRecipients: ["supervisors@business.com"],
      subject: "Reorder Request of Inventory Item",
      body: `Please reorder more of item ${item.name}. The current quantity is ${quantity}.`,
    };

    MailComposer.composeAsync(options).then((result) => {
      if (result.status === "sent") {
        Alert.alert("Reorder email sent successfully!");
      } else {
        Alert.alert("Error", "Failed to send the email.");
      }
    });
  };

  /**
   * @function sendReorderSMS
   * @description Send an SMS to the procurement team to reorder an item
   * @param {object} item - The item to reorder
   * @param {number} quantity - The new quantity of the item
   * @returns {void}
   */
  const sendReorderSMS = async (item, quantity) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("SMS is not available on this device.");
      return;
    }
    const { result } = await SMS.sendSMSAsync(
      ["+1234567890"],
      `Please reorder more of item ${item.name}. The current quantity is ${quantity}. Message sent from the Inventory App. User: ${auth.currentUser.email}`
    );
    if (result === SMS.SentStatus.Sent) {
      Alert.alert("Reorder SMS sent successfully!");
    } else {
      Alert.alert("Error", "Failed to send the SMS.");
    }
  };

  /**
   * @function openItemDetails
   * @description Open the modal to display the details of an item
   * @param {object} item - The item to display
   */
  const openItemDetails = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  /**
   * @function renderCustomFields
   * @description Render the custom fields of the selected item
   * @returns {JSX.Element}
   */
  const renderCustomFields = () => {
    const customFields = selectedItem?.customFields;
    if (customFields) {
      return Object.keys(customFields).map((key) => {
        const field = customFields[key];
        return (
          <View key={key} style={styles.fieldContainer}>
            <Text style={styles.fieldName}>{key}:</Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        );
      });
    }
    return null;
  };

  return (
    <ScrollView style={styles.paddedSection}>
      <View style={styles.headerRow}>
        <FontAwesome name="list" size={24} color="black" />
        <Text style={styles.headerTitle}>Inventory Management</Text>
      </View>

      {inventory.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ fontSize: 18, color: "gray" }}>
            No items in inventory
          </Text>
        </View>
      ) : (
        inventory.map((item) => (
          <View key={item.id} style={styles.registredItem}>
            <Image
              source={{
                uri: item.imageUrl || "https://via.placeholder.com/50",
              }}
              style={{ width: 50, height: 50 }}
            />
            <Text>{item.name}</Text>
            <View style={styles.quantityControls}>
              {/* Display the quantity for all users */}
              <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
                {item.quantity}
              </Text>

              {/* Render controls only if the user is a supervisor */}
              {isSupervisor && (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      updateItemQuantity(
                        item.id,
                        Math.max(Number(item.quantity) - 1, 0)
                      )
                    }
                  >
                    <FontAwesome name="minus-circle" size={24} color="black" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      updateItemQuantity(item.id, Number(item.quantity) + 1)
                    }
                  >
                    <FontAwesome name="plus-circle" size={24} color="black" />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={() => openItemDetails(item)}>
                <FontAwesome name="info-circle" size={24} color="blue" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {selectedItem && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Item Details</Text>
              <Image
                source={{
                  uri:
                    selectedItem.imageUrl ||
                    "https://via.placeholder.com/100x100?text=No+Image",
                }}
                style={styles.itemImage}
              />
              <Text style={styles.modalText}>Name: {selectedItem.name}</Text>
              <Text style={styles.modalText}>
                Description: {selectedItem.description}
              </Text>
              <Text style={styles.modalText}>
                Quantity: {selectedItem.quantity}
              </Text>

              {/* Render Custom Fields Dynamically */}
              {renderCustomFields()}

              <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  paddedSection: {
    width: "100%",
    padding: 15,
    backgroundColor: "#fff",
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
  registredItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  itemImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    alignSelf: "center",
  },
  fieldContainer: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  fieldName: {
    fontWeight: "bold",
    marginRight: 5,
  },
  fieldValue: {
    color: "#555",
  },
});
