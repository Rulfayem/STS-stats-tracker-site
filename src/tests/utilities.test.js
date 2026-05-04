import { describe, it, expect } from "vitest";

//COPIED FUNCTIONS BELOW

//formats playtime in seconds into hours + minutes (from ProfilePage.jsx)
function formatPlaytime(seconds) {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

//converts a card name to spire-codex id format (from SilentStatsPage.jsx)
const toCardId = (cardName) => {
    return cardName
        .replace(/\+\d+$/, "")
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");
};

//removes [gold] formatting tags from spire-codex descriptions (from SilentStatsPage.jsx)
const cleanDesc = (desc) => {
    if (!desc) return "";
    return desc
        .replace(/\[\/?\w+\]/g, "")
        .replace(/\\n/g, " ")
        .trim();
};


// ------= TESTS =------ //


describe("formatPlaytime", () => {
    it("returns 0m when given 0 seconds", () => {
        expect(formatPlaytime(0)).toBe("0m");
    });

    it("returns minutes only when under 1 hour", () => {
        expect(formatPlaytime(1500)).toBe("25m");
    });

    it("returns hours and minutes when over 1 hour", () => {
        expect(formatPlaytime(8712)).toBe("2h 25m");
    });

    it("returns 0m when given null or undefined", () => {
        expect(formatPlaytime(null)).toBe("0m");
        expect(formatPlaytime(undefined)).toBe("0m");
    });
});

describe("toCardId", () => {
    it("converts a simple card name to uppercase with underscores", () => {
        expect(toCardId("Foot Work")).toBe("FOOT_WORK");
    });

    it("converts a camelCase card name correctly", () => {
        expect(toCardId("PiercingWail")).toBe("PIERCING_WAIL");
    });

    it("removes upgrade suffix like +1", () => {
        expect(toCardId("Footwork+1")).toBe("FOOTWORK");
    });

    it("handles hyphens correctly", () => {
        expect(toCardId("Well-Laid Plans")).toBe("WELL_LAID_PLANS");
    });
});

describe("cleanDesc", () => {
    it("removes [gold] and [/gold] tags from description", () => {
        expect(cleanDesc("Deal 8 damage. Apply 2 [gold]Vulnerable[/gold]."))
            .toBe("Deal 8 damage. Apply 2 Vulnerable.");
    });

    it("returns empty string when given null or undefined", () => {
        expect(cleanDesc(null)).toBe("");
        expect(cleanDesc(undefined)).toBe("");
    });

    it("returns the string unchanged if no tags present", () => {
        expect(cleanDesc("Gain 5 Block.")).toBe("Gain 5 Block.");
    });

    it("replaces escaped newlines with spaces", () => {
        expect(cleanDesc("Gain 5 Block.\\nDraw 2 cards.")).toBe("Gain 5 Block. Draw 2 cards.");
    });
});