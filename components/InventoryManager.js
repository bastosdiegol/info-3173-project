import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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

export default function InventoryManager({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [isSupervisor, setIsSupervisor] = useState(false);

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

      // Update the local state
      setInventory((prevInventory) =>
        prevInventory.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error("Error updating item quantity:", error);
    }
  };

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
            </View>
          </View>
        ))
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
});
