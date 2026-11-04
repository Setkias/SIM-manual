function initializeManualVideos() {
    document.querySelectorAll("details.sim-video").forEach((details) => {
        if (details.dataset.simVideoInitialized) {
            return;
        }
        details.dataset.simVideoInitialized = "true";
        const video = details.querySelector("video");
        if (!video) {
            return;
        }
        details.addEventListener("toggle", () => {
            if (details.open) {
                void video.play().catch(() => {});
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    });
}

// The side with more room, judged from the thumbnail alone so a row shares one side.
const roomierSide = {
    name: "roomierSide",
    enabled: true,
    phase: "main",
    data: {skip: false},
    fn({state, name}) {
        if (state.modifiersData[name].skip) {
            return;
        }
        const above = window.Popper.detectOverflow(state, {placement: "top"}).top;
        const below = window.Popper.detectOverflow(state, {placement: "bottom"}).bottom;
        const placement = above <= below ? "top" : "bottom";
        state.modifiersData[name].skip = true;
        if (placement !== state.placement) {
            state.placement = placement;
            state.reset = true;
        }
    },
};

function initializeManualContactPreviews() {
    if (!window.tippy) {
        return;
    }
    const links = [...document.querySelectorAll(
        ".sim-contact-sheet-link, .sim-module-preview-link",
    )].filter((link) => link.dataset.simPreviewId && !link._tippy);
    const previewOptions = {
        allowHTML: false,
        interactive: true,
        // Escape scrolling panel rows; the key handler preserves the thumbnail's tab order.
        appendTo: () => document.body,
        onCreate(instance) {
            const {reference, popper} = instance;
            const onKeyDown = (event) => {
                if (!instance.state.isVisible) {
                    return;
                }
                const links = [...popper.querySelectorAll("a[href]")];
                if (event.key === "Escape") {
                    event.preventDefault();
                    reference.focus();
                    instance.hide();
                } else if (event.key === "Tab") {
                    if (!event.shiftKey && event.target === reference && links.length) {
                        event.preventDefault();
                        links[0].focus();
                    } else if (event.shiftKey && event.target === links[0]) {
                        event.preventDefault();
                        reference.focus();
                    } else if (!event.shiftKey && event.target === links.at(-1)) {
                        // Native Tab continues from the thumbnail to the next page control.
                        reference.focus();
                        instance.hide();
                    }
                }
            };
            reference.addEventListener("keydown", onKeyDown);
            popper.addEventListener("keydown", onKeyDown);
            popper.addEventListener("focusout", (event) => {
                if (!popper.contains(event.relatedTarget) && event.relatedTarget !== reference) {
                    instance.hide();
                }
            });
        },
        content(reference) {
            const preview = document.getElementById(reference.dataset.simPreviewId);
            if (!preview) {
                const wrapper = document.createElement("div");
                const heading = document.createElement("div");
                heading.className = "sim-contact-sheet-preview-heading";
                heading.textContent = reference.dataset.simPreviewTitle || "";
                const summary = document.createElement("div");
                summary.className = "sim-contact-sheet-preview-summary";
                summary.textContent = reference.dataset.simPreviewSummary || "";
                wrapper.append(heading, summary);
                return wrapper;
            }
            const clone = preview.cloneNode(true);
            clone.removeAttribute("hidden");
            clone.removeAttribute("id");
            return clone;
        },
        maxWidth: "min(22rem, calc(100vw - 2rem))",
        placement: "top",
        popperOptions: {
            modifiers: [
                {name: "flip", enabled: false},
                roomierSide,
                // A popup that fits neither side shifts on-screen, even over its thumbnail.
                {name: "preventOverflow", options: {altAxis: true, tether: false}},
            ],
        },
    };
    window.tippy(links, previewOptions);
}

document$.subscribe(initializeManualVideos);
document$.subscribe(initializeManualContactPreviews);
