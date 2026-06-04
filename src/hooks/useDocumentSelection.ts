import { useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useDocumentStore } from "@/store/documentStore";

export function useDocumentSelection() {
  const { deleteMultipleDocuments, deleteMultipleFolders } = useDocumentStore();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [selectedFolderNames, setSelectedFolderNames] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocumentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFolderSelection = (name: string) => {
    setSelectedFolderNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleStartSelectionWithDoc = (id: string) => {
    setIsSelectionMode(true);
    setSelectedDocumentIds(new Set([id]));
    setSelectedFolderNames(new Set());
  };

  const handleStartSelectionWithFolder = (name: string) => {
    setIsSelectionMode(true);
    setSelectedFolderNames(new Set([name]));
    setSelectedDocumentIds(new Set());
  };

  const handleExitSelection = () => {
    setIsSelectionMode(false);
    setSelectedDocumentIds(new Set());
    setSelectedFolderNames(new Set());
  };

  const handleConfirmBulkDelete = async () => {
    try {
      const docIds = Array.from(selectedDocumentIds);
      const folderNames = Array.from(selectedFolderNames);

      // Call store actions
      if (docIds.length > 0) {
        await deleteMultipleDocuments(docIds);
      }
      if (folderNames.length > 0) {
        await deleteMultipleFolders(folderNames);
      }

      AccessibilityInfo.announceForAccessibility(
        `Deleted ${docIds.length} documents and ${folderNames.length} folders`
      );
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setIsBulkDeleteModalVisible(false);
      handleExitSelection();
    }
  };

  return {
    isSelectionMode,
    selectedDocumentIds,
    selectedFolderNames,
    isBulkDeleteModalVisible,
    setIsBulkDeleteModalVisible,
    toggleDocumentSelection,
    toggleFolderSelection,
    handleStartSelectionWithDoc,
    handleStartSelectionWithFolder,
    handleExitSelection,
    handleConfirmBulkDelete,
  };
}
