# Level-Based DC Check Module

This module adds support for interactive DC check buttons in Foundry VTT chat messages for the Pathfinder 2e system.

## Installation

1. Copy the `level-based-dc` folder to your Foundry VTT modules directory:
   - **Windows**: `%localappdata%/FoundryVTT/Data/modules/`
   - **macOS**: `~/Library/Application Support/FoundryVTT/Data/modules/`
   - **Linux**: `~/.local/share/FoundryVTT/Data/modules/`

2. Restart Foundry VTT or reload the world

3. Go to **Game Settings** → **Manage Modules**

4. Enable the **Level-Based DC Checks** module

5. Save and reload

## Usage

Once the module is enabled, it automatically installs a hook on all clients (GM and players) that handles DC check button clicks.

The `Level_Based_DC.js` macro (in Misc Macros) creates chat messages with interactive buttons. When any user clicks the "Roll Check" button:

1. A dialog appears asking which skill to use
2. The skill is rolled as a secret check (blindroll)
3. Only the GM sees the actual roll result
4. The DC remains hidden from players (sent as a GM-only whisper)

## How It Works

- The module installs a `renderChatMessage` hook on all connected clients when Foundry loads
- When a chat message is rendered that contains a `.dc-check-btn` button, the hook attaches a click handler
- The button stores the DC and difficulty in data attributes
- When clicked, it opens a skill selection dialog and rolls the check

## Requirements

- Foundry VTT v11+
- Pathfinder 2e game system
