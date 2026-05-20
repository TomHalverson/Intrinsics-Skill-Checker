// Level-Based DC Generator for PF2e
// Generates DCs based on party level and difficulty tier
// Reference: https://2e.aonprd.com/Rules.aspx?ID=2629
// NOTE: Requires the "level-based-dc" module to be enabled for button functionality

// Get party level - try to find PF2e party actor first, then fall back to individual PCs
let partyLevel = null;

// Try to find the party actor
const partyActor = game.actors.find(a => a.type === "party");
if (partyActor) {
    // Get level from any party member
    const members = partyActor.members;
    if (members && members.length > 0) {
        partyLevel = members[0].level;
    }
}

// Fallback to finding individual player characters
if (!partyLevel) {
    const playerCharacters = game.actors.filter(a =>
        a.type === "character" &&
        a.hasPlayerOwner
    );

    if (playerCharacters.length === 0) {
        ui.notifications.error("No player characters found!");
        return;
    }

    partyLevel = playerCharacters[0].level;
}

if (!partyLevel) {
    ui.notifications.error("Could not determine party level!");
    return;
}

// DC calculation functions based on PF2e rules
const calculateDC = (level, difficulty) => {
    const dcTable = {
        "Trivial": Math.max(10, level + 10),
        "Low": Math.max(10, level + 11),
        "Moderate": level + 13,
        "High": level + 14,
        "Extreme": level + 16
    };
    return dcTable[difficulty];
};

// Show dialog to select difficulty
const difficulty = await new Promise((resolve) => {
    new Dialog({
        title: "Select DC Difficulty",
        content: `
            <div style="margin-bottom: 10px;">
                <p><strong>Party Level:</strong> ${partyLevel}</p>
                <p>Select the difficulty tier for this check:</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: #4a5568; color: white;">
                        <th style="padding: 5px; border: 1px solid #cbd5e0;">Difficulty</th>
                        <th style="padding: 5px; border: 1px solid #cbd5e0;">DC</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="padding: 5px; border: 1px solid #cbd5e0;">Trivial</td><td style="padding: 5px; border: 1px solid #cbd5e0; text-align: center;">${calculateDC(partyLevel, "Trivial")}</td></tr>
                    <tr><td style="padding: 5px; border: 1px solid #cbd5e0;">Low</td><td style="padding: 5px; border: 1px solid #cbd5e0; text-align: center;">${calculateDC(partyLevel, "Low")}</td></tr>
                    <tr><td style="padding: 5px; border: 1px solid #cbd5e0;">Moderate</td><td style="padding: 5px; border: 1px solid #cbd5e0; text-align: center;">${calculateDC(partyLevel, "Moderate")}</td></tr>
                    <tr><td style="padding: 5px; border: 1px solid #cbd5e0;">High</td><td style="padding: 5px; border: 1px solid #cbd5e0; text-align: center;">${calculateDC(partyLevel, "High")}</td></tr>
                    <tr><td style="padding: 5px; border: 1px solid #cbd5e0;">Extreme</td><td style="padding: 5px; border: 1px solid #cbd5e0; text-align: center;">${calculateDC(partyLevel, "Extreme")}</td></tr>
                </tbody>
            </table>
        `,
        buttons: {
            trivial: {
                label: "Trivial",
                callback: () => resolve("Trivial")
            },
            low: {
                label: "Low",
                callback: () => resolve("Low")
            },
            moderate: {
                label: "Moderate",
                callback: () => resolve("Moderate")
            },
            high: {
                label: "High",
                callback: () => resolve("High")
            },
            extreme: {
                label: "Extreme",
                callback: () => resolve("Extreme")
            },
            cancel: {
                label: "Cancel",
                callback: () => resolve(null)
            }
        },
        default: "moderate"
    }).render(true);
});

if (!difficulty) {
    ui.notifications.info("DC generation cancelled.");
    return;
}

const dc = calculateDC(partyLevel, difficulty);

// Optional: Ask for a custom description
const description = await new Promise((resolve) => {
    new Dialog({
        title: "Check Description (Optional)",
        content: `
            <div style="margin-bottom: 10px;">
                <p>Enter a description for this check (optional):</p>
                <input type="text" id="check-description" style="width: 100%; padding: 5px; margin-top: 5px;" placeholder="e.g., Climb the cliff, Notice the trap, etc."/>
            </div>
        `,
        buttons: {
            ok: {
                label: "Create Check",
                callback: (html) => {
                    const desc = html.find("#check-description").val();
                    resolve(desc || "Intrinsic Skill Check");
                }
            },
            cancel: {
                label: "Skip",
                callback: () => resolve("Intrinsic Skill Check")
            }
        },
        default: "ok"
    }).render(true);
});

// Generate unique ID for this check
const checkId = `DC_${Date.now()}`;

// Create chat message with check button - visible to all players
const chatContent = `
<div class="card-header" style="background: linear-gradient(135deg, #35136bff 0%, #2e0e61ff 100%); color: white; padding: 10px; border-radius: 5px 5px 0 0;">
    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-dice-d20"></i>
        ${description}
    </h3>
</div>
<div class="card-content" style="padding: 10px; background: #1F2937; border: 1px solid #374151; border-radius: 0 0 5px 5px; color: #E5E7EB;">
    <p><strong>Difficulty:</strong> ${difficulty}</p>
    <p><strong>Party Level:</strong> ${partyLevel}</p>
    <hr style="margin: 10px 0; border-color: #4B5563;">
    <div style="margin-top: 10px;">
        <button class="dc-check-btn" data-dc="${dc}" data-difficulty="${difficulty}" style="
            background: linear-gradient(135deg, #35136bff 0%, #2e0e61ff 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            width: 100%;
        ">
            <i class="fas fa-dice-d20"></i> Roll Check
        </button>
    </div>
</div>
`;

// Create GM-only whisper with the DC
await ChatMessage.create({
    user: game.user.id,
    whisper: game.users.filter(u => u.isGM).map(u => u.id),
    content: `<p><strong>DC for "${description}":</strong> ${dc} (${difficulty})</p>`
});

// Create the chat message with flags
await ChatMessage.create({
    user: game.user.id,
    content: chatContent,
    flags: {
        dcCheck: {
            id: checkId,
            dc: dc,
            difficulty: difficulty
        }
    }
});

ui.notifications.info(`DC ${dc} (${difficulty}) check created!`);