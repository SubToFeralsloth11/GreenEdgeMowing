const orderModal = document.getElementById("order-modal");
const openButtons = document.querySelectorAll("[data-open-order]");
const closeButtons = document.querySelectorAll("[data-close-order]");
const modalPrimaryAction = orderModal?.querySelector(".button.button-solid");
const promoFloat = document.getElementById("promo-float");
const promoVideo = document.getElementById("promo-video");
const promoCloseButton = document.getElementById("promo-close");
const showcaseImages = Array.from(document.querySelectorAll("[data-showcase-image]"));
const showcaseVideos = Array.from(document.querySelectorAll("[data-showcase-video]"));
const showcaseStage = document.querySelector(".showcase-stage");

const promoMediaFiles = [
    "like and sub gif.gif.mp4"
];

const showcaseMediaItems = [
    {
        src: "AD's/GreenEdge Mowing.mp4",
        type: "video",
        title: "GreenEdge Mowing",
        caption: "Clean, reliable mowing promoted through bold video content."
    },
    {
        src: "AD's/Get started with green edge mowing today.mp4",
        type: "video",
        title: "Get Started Today",
        caption: "A direct call to action for booking and getting the job moving quickly."
    },
    {
        src: "AD's/Treat yourself and pair woth GreenEdge Mowing!.mp4",
        type: "video",
        title: "Pair With GreenEdge",
        caption: "A more promotional feature spot designed to keep the page feeling active."
    },
    {
        src: "AD's/GreenEdge Mowing.png",
        type: "image",
        title: "Featured Promotion",
        caption: "A static promotional graphic presented alongside the moving ads."
    },
    {
        src: "AD's/Untitled design.png",
        type: "image",
        title: "Seasonal Visual",
        caption: "Graphic content rotates in with the videos to keep the showcase varied."
    }
];

let previousFocus = null;
let promoVisible = false;
let promoDismissed = false;
let promoMediaIndex = 0;
let showcaseMediaIndexes = [];
let showcaseMediaTimer = null;
let showcaseTransitionTimeout = null;

function playPromoVideo({ restart = false } = {}) {
    if (!promoVideo) {
        return;
    }

    const startPlayback = () => {
        if (!promoVideo || promoDismissed || !promoVisible) {
            return;
        }

        if (restart) {
            promoVideo.currentTime = 0;
        }

        const playAttempt = promoVideo.play();

        if (playAttempt && typeof playAttempt.catch === "function") {
            playAttempt.catch(() => {});
        }
    };

    if (promoVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        startPlayback();
        return;
    }

    promoVideo.addEventListener("loadeddata", startPlayback, { once: true });
}

function openModal() {
    previousFocus = document.activeElement;
    orderModal.hidden = false;
    document.body.classList.add("modal-open");
    suppressPromo();

    if (modalPrimaryAction instanceof HTMLElement) {
        modalPrimaryAction.focus();
    }
}

function closeModal() {
    orderModal.hidden = true;
    document.body.classList.remove("modal-open");
    restorePromo();

    if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
    }
}

function getNextShowcaseIndexes() {
    if (!showcaseMediaItems.length) {
        return [];
    }

    const availableIndexes = showcaseMediaItems.map((_, index) => index);

    for (let index = availableIndexes.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [availableIndexes[index], availableIndexes[randomIndex]] = [availableIndexes[randomIndex], availableIndexes[index]];
    }

    const nextIndexes = availableIndexes.slice(0, Math.min(2, availableIndexes.length));

    if (nextIndexes.length === 2 && showcaseMediaIndexes.length === 2 && nextIndexes.every((index, position) => index === showcaseMediaIndexes[position])) {
        nextIndexes.reverse();
    }

    return nextIndexes;
}

function setShowcaseMedia(indexes) {
    if (!indexes.length || !showcaseImages.length || !showcaseVideos.length) {
        return;
    }

    showcaseMediaIndexes = indexes;

    indexes.forEach((mediaIndex, slotIndex) => {
        const media = showcaseMediaItems[mediaIndex];
        const showcaseImage = showcaseImages[slotIndex];
        const showcaseVideo = showcaseVideos[slotIndex];

        if (!media || !showcaseImage || !showcaseVideo) {
            return;
        }

        if (media.type === "video") {
            showcaseImage.hidden = true;
            showcaseVideo.hidden = false;
            showcaseVideo.src = encodeURI(media.src);
            showcaseVideo.load();

            const playAttempt = showcaseVideo.play();

            if (playAttempt && typeof playAttempt.catch === "function") {
                playAttempt.catch(() => {});
            }

            return;
        }

        showcaseVideo.pause();
        showcaseVideo.removeAttribute("src");
        showcaseVideo.load();
        showcaseVideo.hidden = true;
        showcaseImage.hidden = false;
        showcaseImage.src = encodeURI(media.src);
        showcaseImage.alt = media.title;
    });
}

function rotateShowcaseMedia() {
    if (!showcaseMediaItems.length) {
        return;
    }

    const nextIndexes = getNextShowcaseIndexes();

    if (!showcaseStage) {
        setShowcaseMedia(nextIndexes);
        return;
    }

    if (showcaseTransitionTimeout) {
        window.clearTimeout(showcaseTransitionTimeout);
    }

    showcaseStage.classList.remove("is-entering");
    showcaseStage.classList.add("is-transitioning");

    showcaseTransitionTimeout = window.setTimeout(() => {
        setShowcaseMedia(nextIndexes);
        showcaseStage.classList.remove("is-transitioning");
        showcaseStage.classList.add("is-entering");

        showcaseTransitionTimeout = window.setTimeout(() => {
            showcaseStage.classList.remove("is-entering");
            showcaseTransitionTimeout = null;
        }, 420);
    }, 240);
}

function startShowcaseMediaRotation() {
    if (!showcaseMediaItems.length) {
        return;
    }

    window.clearInterval(showcaseMediaTimer);
    rotateShowcaseMedia();
    showcaseMediaTimer = window.setInterval(rotateShowcaseMedia, 7000);
}

function setPromoMedia(index) {
    if (!promoVideo || !promoMediaFiles.length) {
        return;
    }

    promoMediaIndex = index;
    const nextSource = encodeURI(promoMediaFiles[promoMediaIndex]);

    if (promoVideo.src.endsWith(nextSource)) {
        return;
    }

    promoVideo.src = nextSource;
    promoVideo.load();
}

function hidePromo() {
    if (!promoFloat || !promoVisible) {
        return;
    }

    promoVisible = false;
    promoFloat.classList.remove("is-visible");

    if (promoVideo) {
        promoVideo.pause();
    }

    window.setTimeout(() => {
        if (!promoVisible && promoFloat) {
            promoFloat.hidden = true;
        }
    }, 260);
}

function showPromo() {
    if (!promoFloat || promoDismissed || !orderModal.hidden) {
        return;
    }

    setPromoMedia(promoMediaIndex);
    promoFloat.hidden = false;
    promoFloat.classList.remove("is-suppressed");
    window.requestAnimationFrame(() => {
        promoFloat.classList.add("is-visible");
    });

    promoVisible = true;
    playPromoVideo({ restart: true });
}

function suppressPromo() {
    if (!promoFloat || promoDismissed || !promoVisible) {
        return;
    }

    promoFloat.classList.add("is-suppressed");

    if (promoVideo) {
        promoVideo.pause();
    }
}

function restorePromo() {
    if (!promoFloat || promoDismissed) {
        return;
    }

    if (!promoVisible) {
        showPromo();
        return;
    }

    promoFloat.classList.remove("is-suppressed");
    playPromoVideo();
}

function dismissPromo() {
    promoDismissed = true;
    hidePromo();
}

function dismissPromoWhenFinished() {
    if (!promoVideo || !promoVisible || promoDismissed) {
        return;
    }

    if (Number.isFinite(promoVideo.duration) && promoVideo.duration > 0 && promoVideo.currentTime >= promoVideo.duration - 0.15) {
        dismissPromo();
    }
}

openButtons.forEach((button) => {
    button.addEventListener("click", openModal);
});

closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
});

promoCloseButton?.addEventListener("click", dismissPromo);
promoVideo?.addEventListener("ended", dismissPromo);
promoVideo?.addEventListener("timeupdate", dismissPromoWhenFinished);
promoVideo?.addEventListener("waiting", () => playPromoVideo());
promoVideo?.addEventListener("stalled", () => playPromoVideo());
startShowcaseMediaRotation();
setPromoMedia(0);
showPromo();

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !orderModal.hidden) {
        closeModal();
    }
});