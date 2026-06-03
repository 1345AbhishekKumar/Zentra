# Zentra Domain Glossary

This file documents the core domain terms and concepts of Zentra.

## Terms

### Document Vault
The local, sandbox-isolated container on the user's mobile device. It holds all serialized document metadata in AsyncStorage and physical file attachments in the application's document directory. It operates strictly offline with zero external cloud synchronization.

### Zentra Document
A record representing a user's uploaded document. It contains metadata such as `id`, `name`, `category` (representing the folder it belongs to), `expiryDate`, notes, and notification status.

### Attachment
The raw physical file (e.g., PDF or image) stored securely in the local application filesystem sandbox (`FileSystem.documentDirectory`). Referenced by a URI in the Zentra Document metadata.

### Notification Schedule
The set of upcoming alerts registered on the device's native OS Notification Center to remind the user of an approaching document expiry date.

### Security Lock
A biometric (face/fingerprint) or PIN-based gate that protects the local vault from unauthorized access when the application is launched or foregrounded.
