import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { db, firestore, auth } from "../FirebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export default function CreateItem({ navigation }) {
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState(0);
  const [customizedFieldsMap, setCustomizedFieldsMap] = useState(new Map());
  const [modalVisible, setModalVisible] = useState(false);
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldTypes, setCustomFieldTypes] = useState([
    "",
    "Text",
    "Number",
    "Date",
    "Boolean",
  ]);
  const [selectedFieldType, setSelectedFieldType] = useState("");

  /**
   * @function handleAddCustomField
   * @description Add a custom field to the item.
   * @returns {void}
   */
  const handleAddCustomField = () => {
    if (customFieldName && selectedFieldType) {
      setCustomizedFieldsMap((prevMap) => {
        const updatedMap = new Map(prevMap);
        updatedMap.set(customFieldName, { type: selectedFieldType, value: "" });
        return updatedMap;
      });
      setCustomFieldName("");
      setSelectedFieldType("");
      setModalVisible(false);
    }
  };

  /**
   * @function renderCustomFields
   * @description Render the custom fields for the item.
   * @returns {JSX.Element}
   */
  const renderCustomFields = () => {
    return Array.from(customizedFieldsMap.entries()).map(
      ([name, { type, value }]) => (
        <View key={name} style={styles.inputRow}>
          <Text style={styles.label}>{name}:</Text>
          {type === "Text" || type === "Number" ? (
            <TextInput
              style={styles.input}
              keyboardType={type === "Number" ? "numeric" : "default"}
              value={value}
              onChangeText={(newValue) =>
                handleCustomFieldChange(name, newValue)
              }
            />
          ) : type === "Date" ? (
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={(newValue) =>
                handleCustomFieldChange(name, newValue)
              }
            />
          ) : type === "Boolean" ? (
            <Picker
              style={styles.input}
              selectedValue={value}
              onValueChange={(newValue) =>
                handleCustomFieldChange(name, newValue)
              }
            >
              <Picker.Item label="" value="" />
              <Picker.Item label="True" value="true" />
              <Picker.Item label="False" value="false" />
            </Picker>
          ) : null}
        </View>
      )
    );
  };

  /**
   * @function handleCustomFieldChange
   * @description Update the value of a custom field.
   * @param {string} fieldName - The name of the custom field.
   * @param {string} newValue - The new value of the custom field.
   * @returns {void}
   */
  const handleCustomFieldChange = (fieldName, newValue) => {
    setCustomizedFieldsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      if (updatedMap.has(fieldName)) {
        updatedMap.set(fieldName, {
          ...updatedMap.get(fieldName),
          value: newValue,
        });
      }
      return updatedMap;
    });
  };

  /**
   * @function saveItem
   * @description Save the item to Firestore.
   * @returns {void}
   */
  const saveItem = async () => {
    try {
      // Creates the custom fields object
      const customFields = Array.from(customizedFieldsMap.entries()).reduce(
        (acc, [name, { type, value }]) => {
          acc[name] = { type, value };
          return acc;
        },
        {}
      );

      const itemData = {
        name: itemName,
        description: itemDescription,
        quantity: itemQuantity,
        customFields,
      };
      console.log("Item Data: ", itemData);

      // Save the item to Firestore
      const itemsCollectionRef = collection(firestore, "items");
      await addDoc(itemsCollectionRef, itemData);

      console.log("Item saved successfully!");
      handleCancelModal();
    } catch (error) {
      console.error("Error saving item: ", error);
    }
  };

  const clearCustomFields = () => {
    setCustomizedFieldsMap(new Map());
  };

  const handleCancelModal = () => {
    setModalVisible(false);
    setCustomFieldName("");
    setSelectedFieldType("");
  };

  return (
    <View>
      <ScrollView style={styles.paddedSection}>
        <View style={styles.headerRow}>
          <Ionicons name="create" size={24} color="black" />
          <Text style={styles.headerTitle}>Create New Item</Text>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Item Name:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setItemName(text)}
            value={itemName}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Description:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setItemDescription(text)}
            value={itemDescription}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Quantity:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setItemQuantity(text)}
            value={itemQuantity}
            keyboardType="numeric"
          />
        </View>

        {renderCustomFields()}

        <View style={styles.line} />
        <View style={styles.modalButtons}>
          <Button
            title="Add Custom Field"
            onPress={() => setModalVisible(true)}
          />
          <Button title="Clear Custom Fields" onPress={clearCustomFields} />
        </View>

        <View style={styles.line} />
        <Button title="Save New Item" onPress={saveItem} />

        {/** Modal for Custom Fields */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Ionicons name="add" size={24} color="black" />
              <Text style={styles.modalTitle}>Add Custom Field</Text>
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Field Name:</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => setCustomFieldName(text)}
                value={customFieldName}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Field Type:</Text>
              <Picker
                selectedValue={selectedFieldType}
                style={styles.input}
                onValueChange={(itemValue) => setSelectedFieldType(itemValue)}
              >
                {customFieldTypes.map((type, index) => (
                  <Picker.Item key={index} label={type} value={type} />
                ))}
              </Picker>
            </View>
            <View style={styles.modalButtons}>
              <Button title="Add" onPress={handleAddCustomField} />
              <Button title="Cancel" onPress={handleCancelModal} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
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
  modalView: {
    width: "100%",
    height: "35%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 50,
    position: "absolute",
    bottom: 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333", // Dark text for good contrast
    marginLeft: 10,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    width: "100%",
    gap: 10,
    marginTop: 10,
  },
});
