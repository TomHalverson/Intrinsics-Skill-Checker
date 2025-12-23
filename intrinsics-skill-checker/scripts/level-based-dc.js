// Level-Based DC Check Module
// Installs hook on all clients to handle DC check button clicks

Hooks.once("ready", () => {
    console.log("Level-Based DC Check module loaded");

    // Install the renderChatMessage hook on all clients
    Hooks.on("renderChatMessage", (_message, html) => {
        const button = html.find('.dc-check-btn');
        if (button.length === 0) return;

        button.off('click').on('click', async function() {
            const dc = parseInt($(this).data("dc"));
            const difficulty = $(this).data("difficulty");

            console.log("DC Check button clicked by:", game.user.name);

            let actor = null;
            if (canvas.tokens.controlled.length > 0) {
                actor = canvas.tokens.controlled[0].actor;
            } else {
                actor = game.actors.filter(a =>
                    a.type === "character" &&
                    a.permission[game.user.id] === 3
                )[0];
            }

            if (!actor) {
                ui.notifications.error("No character selected or assigned!");
                return;
            }

            const skills = actor.skills;
            if (!skills) {
                ui.notifications.error("Character has no skills!");
                return;
            }

            const skillNames = Object.keys(skills).sort();
            const skillOptions = skillNames.map(key => {
                const skill = skills[key];
                const modifier = skill.modifiers?.[0]?.modifier || skill.mod || 0;
                const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                return `<option value="${key}">${skill.label || key} (${modStr})</option>`;
            }).join("");

            new Dialog({
                title: "Select Skill",
                content: `
                    <div style="margin-bottom: 10px;">
                        <p><strong>${difficulty} Check</strong></p>
                        <p>Select which skill to use:</p>
                        <select id="skill-select" style="width: 100%; padding: 5px; margin-top: 5px;">
                            ${skillOptions}
                        </select>
                    </div>
                `,
                buttons: {
                    roll: {
                        label: "Roll",
                        callback: async (html) => {
                            const selectedSkill = html.find("#skill-select").val();
                            const skill = skills[selectedSkill];

                            if (skill.roll) {
                                await skill.roll({
                                    dc: { value: dc },
                                    extraRollOptions: [difficulty.toLowerCase()],
                                    rollMode: "blindroll"
                                });
                            } else {
                                ui.notifications.warn("Unable to roll skill check.");
                            }
                        }
                    },
                    cancel: {
                        label: "Cancel"
                    }
                },
                default: "roll"
            }).render(true);
        });
    });

    console.log("DC Check hook installed for user:", game.user.name);
});
