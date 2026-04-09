const quoteForm = document.getElementById("quote-form");
const lawnSizeInput = document.getElementById("lawn-size");
const fullAddressInput = document.getElementById("full-address");
const accessNotesInput = document.getElementById("access-notes");
const extraInfoInput = document.getElementById("extra-info");
const selectedTierLabel = document.getElementById("selected-tier-label");
const quoteStatus = document.getElementById("quote-status");
const quotePrice = document.getElementById("quote-price");
const quotePriceNote = document.getElementById("quote-price-note");
const quoteMessage = document.getElementById("quote-message");
const customQuoteLink = document.getElementById("custom-quote-link");
const quoteEmailFallback = document.getElementById("quote-email-fallback");
const quoteEmailLink = document.getElementById("quote-email-link");
const quoteDraftStorageKey = "greenedge-quote-draft";

const tierPresets = {
    small: {
        label: "Small lawn",
        range: "Up to 200 m²",
        price: "$40"
    },
    medium: {
        label: "Medium lawn",
        range: "200-350 m²",
        price: "$50"
    },
    large: {
        label: "Large lawn",
        range: "350-450 m²",
        price: "$66"
    },
    custom: {
        label: "Custom lawn",
        range: "Over 450 m²",
        price: "Custom quote"
    }
};

const currentTierKey = getTierFromQuery();

function getTierFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const requestedTier = params.get("tier");

    if (requestedTier && tierPresets[requestedTier]) {
        return requestedTier;
    }

    return "small";
}

function formatSelectedTier(tierKey) {
    const tier = tierPresets[tierKey] || tierPresets.small;
    return `${tier.label} selected from pricing page · ${tier.range} · ${tier.price}`;
}

function calculateQuote(sizeValue) {
    const size = Number(sizeValue);

    if (!Number.isFinite(size) || size <= 0) {
        return {
            status: "Waiting for lawn size",
            price: "$0",
            note: "Enter the lawn size to calculate the price.",
            tier: "Not set",
            canSend: false
        };
    }

    if (size <= 200) {
        return {
            status: "Small lawn price ready",
            price: "$40",
            note: "Standard price for lawns up to 200 m².",
            tier: "Small lawn",
            canSend: true
        };
    }

    if (size <= 350) {
        return {
            status: "Medium lawn price ready",
            price: "$50",
            note: "Standard price for lawns from 200 m² to 350 m².",
            tier: "Medium lawn",
            canSend: true
        };
    }

    if (size <= 450) {
        return {
            status: "Large lawn price ready",
            price: "$66",
            note: "Standard price for lawns from 350 m² to 450 m².",
            tier: "Large lawn",
            canSend: true
        };
    }

    return {
        status: "Custom quote required",
        price: "Custom quote",
        note: "Lawns over 450 m² need a manual review, but you can still send the request.",
        tier: "Custom size",
        canSend: true
    };
}

function saveQuoteDraft() {
    const draft = {
        lawnSize: lawnSizeInput?.value || "",
        address: fullAddressInput?.value || "",
        accessNotes: accessNotesInput?.value || "",
        extraInfo: extraInfoInput?.value || ""
    };

    window.sessionStorage.setItem(quoteDraftStorageKey, JSON.stringify(draft));
}

function restoreQuoteDraft() {
    const storedDraft = window.sessionStorage.getItem(quoteDraftStorageKey);

    if (!storedDraft) {
        return;
    }

    try {
        const draft = JSON.parse(storedDraft);

        if (lawnSizeInput && typeof draft.lawnSize === "string") {
            lawnSizeInput.value = draft.lawnSize;
        }

        if (fullAddressInput && typeof draft.address === "string") {
            fullAddressInput.value = draft.address;
        }

        if (accessNotesInput && typeof draft.accessNotes === "string") {
            accessNotesInput.value = draft.accessNotes;
        }

        if (extraInfoInput && typeof draft.extraInfo === "string") {
            extraInfoInput.value = draft.extraInfo;
        }
    } catch {
        window.sessionStorage.removeItem(quoteDraftStorageKey);
    }
}

function updateCustomQuoteLink(quote) {
    if (!customQuoteLink) {
        return;
    }

    const shouldShowCustomLink = quote.price === "Custom quote" && currentTierKey !== "custom";

    customQuoteLink.hidden = !shouldShowCustomLink;

    if (!shouldShowCustomLink) {
        customQuoteLink.href = "quote.html?tier=custom";
        return;
    }

    const params = new URLSearchParams({ tier: "custom" });
    const lawnSize = lawnSizeInput?.value?.trim();

    if (lawnSize) {
        params.set("size", lawnSize);
    }

    customQuoteLink.href = `quote.html?${params.toString()}`;
}

function updateQuoteSummary() {
    const quote = calculateQuote(lawnSizeInput?.value);

    if (quoteStatus) {
        quoteStatus.textContent = quote.status;
    }

    if (quotePrice) {
        quotePrice.textContent = quote.price;
    }

    if (quotePriceNote) {
        quotePriceNote.textContent = quote.note;
    }

    updateCustomQuoteLink(quote);

    return quote;
}

function setSelectedTierLabel() {
    if (!selectedTierLabel) {
        return;
    }

    selectedTierLabel.textContent = formatSelectedTier(currentTierKey);
}

function restoreSizeFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const requestedSize = params.get("size");

    if (requestedSize && lawnSizeInput && !lawnSizeInput.value) {
        lawnSizeInput.value = requestedSize;
    }
}

function buildEmailBody(quote) {
    const lawnSize = lawnSizeInput?.value?.trim() || "Not provided";
    const address = fullAddressInput?.value?.trim() || "Not provided";
    const accessNotes = accessNotesInput?.value?.trim() || "None provided";
    const extraInfo = extraInfoInput?.value?.trim() || "None provided";

    return [
        "Hi GreenEdge Mowing,",
        "",
        "I would like to request a lawn mowing service.",
        "",
        `Lawn size: ${lawnSize} m²`,
        `Calculated category: ${quote.tier}`,
        `Calculated price: ${quote.price}`,
        `Address: ${address}`,
        `Access notes: ${accessNotes}`,
        `Extra info: ${extraInfo}`,
        "",
        "Thank you."
    ].join("\n");
}

function buildMailtoUrl(quote) {
    const subject = encodeURIComponent("GreenEdge Mowing Quote Request");
    const body = encodeURIComponent(buildEmailBody(quote));

    return `mailto:greenedgemowing00@gmail.com?subject=${subject}&body=${body}`;
}

function updateEmailFallbackLink(mailtoUrl) {
    if (quoteEmailLink) {
        quoteEmailLink.href = mailtoUrl;
    }
}

function sendQuoteEmail(event) {
    event.preventDefault();

    if (!quoteForm) {
        return;
    }

    if (!quoteForm.reportValidity()) {
        if (quoteMessage) {
            quoteMessage.textContent = "Fill in the required fields before sending the email.";
            quoteMessage.className = "quote-message is-error";
        }
        return;
    }

    const quote = updateQuoteSummary();
    const mailtoUrl = buildMailtoUrl(quote);

    saveQuoteDraft();
    updateEmailFallbackLink(mailtoUrl);

    if (quoteMessage) {
        quoteMessage.textContent = "Trying to open your email app with the quote details.";
        quoteMessage.className = "quote-message is-success";
    }

    if (quoteEmailFallback) {
        quoteEmailFallback.hidden = false;
    }

    if (quoteEmailLink) {
        quoteEmailLink.click();
        return;
    }

    window.location.assign(mailtoUrl);
}

setSelectedTierLabel();
restoreQuoteDraft();
restoreSizeFromQuery();
updateQuoteSummary();

lawnSizeInput?.addEventListener("input", () => {
    updateQuoteSummary();
    saveQuoteDraft();

    if (quoteMessage) {
        quoteMessage.textContent = "";
        quoteMessage.className = "quote-message";
    }

    if (quoteEmailFallback) {
        quoteEmailFallback.hidden = true;
    }
});

fullAddressInput?.addEventListener("input", saveQuoteDraft);
accessNotesInput?.addEventListener("input", saveQuoteDraft);
extraInfoInput?.addEventListener("input", saveQuoteDraft);

customQuoteLink?.addEventListener("click", saveQuoteDraft);

quoteForm?.addEventListener("submit", sendQuoteEmail);