import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Modal,
  TouchableOpacity,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { db, firestore, auth, storage, storageRef } from "../FirebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { set } from "firebase/database";

export default function CreateItem({ navigation }) {
  const [imageUri, setImageUri] = useState("");
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
    // Upload the image to Firebase Storage
    let imageDownloadUrl = "";

    try {
      if (imageUri) {
        // Upload image and get the download URL
        imageDownloadUrl = await uploadImageToFirebaseStorage(imageUri);
      }

      // Creates the custom fields object
      const customFields = Array.from(customizedFieldsMap.entries()).reduce(
        (acc, [name, { type, value }]) => {
          acc[name] = { type, value };
          return acc;
        },
        {}
      );

      const itemData = {
        imageUrl: imageDownloadUrl,
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
      navigation.navigate("InventoryManager");
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

  /**
   * @function verifyPermissions
   * @description Verify if the app has the necessary permissions.
   * @returns {boolean}
   * @async
   * @throws {Error} - If the app does not have the necessary permissions.
   */
  const verifyPermissions = async () => {
    const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
    const libraryResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (
      cameraResult.status !== "granted" &&
      libraryResult.status !== "granted"
    ) {
      Alert.alert("Need Permissions", [{ text: "Okay" }]);
      return false;
    } else {
      return true;
    }
  };

  /**
   * @function takeImageHandler
   * @description Take an image with the camera.
   * @returns {void}
   * @async
   * @throws {Error} - If the app does not have the necessary permissions.
   */
  const takeImageHandler = async () => {
    const hasPermissions = await verifyPermissions();
    if (!hasPermissions) {
      console.log("We don't have permissions");
      return false;
    }
    const image = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    });
    if (!image.canceled) {
      setImageUri(image.assets[0].uri);
      console.log(image.assets[0].uri);
    }
  };

  /**
   * Uploads an image to Firebase Storage.
   * @param {string} imageUri - The local URI of the image to upload.
   * @returns {Promise<string>} - A promise that resolves with the download URL of the uploaded image.
   */
  const uploadImageToFirebaseStorage = async (imageUri) => {
    try {
      // Create a reference to a unique file name in Firebase Storage
      const fileName = `images/${Date.now()}.jpg`;

      // Convert the local image URI to a Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload the blob to Firebase Storage
      await uploadBytes(storageRef, blob);

      // Get the download URL of the uploaded image
      const downloadUrl = await getDownloadURL(storageRef);
      console.log("Image uploaded successfully. Download URL:", downloadUrl);

      return downloadUrl;
    } catch (error) {
      console.error("Error uploading image to Firebase Storage:", error);
      throw error;
    }
  };

  return (
    <View>
      <ScrollView style={styles.paddedSection}>
        <View style={styles.headerRow}>
          <Ionicons name="create" size={24} color="black" />
          <Text style={styles.headerTitle}>Create New Item</Text>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Image:</Text>
          <TouchableOpacity onPress={takeImageHandler}>
            {imageUri === "" ? (
              <Ionicons name="camera" size={100} color="black" />
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 50, height: 50 }}
              />
            )}
          </TouchableOpacity>
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
            onChangeText={(text) => setItemQuantity(parseInt(text) || 0)}
            value={itemQuantity.toString()}
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
