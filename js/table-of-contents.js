class TableOfContents {
  constructor() {
    this.tocContainer = document.getElementById("tocList");
    this.headings = [];
    this.activeSection = null;

    // Only initialize if the TOC container exists
    if (this.tocContainer) {
      this.init();
    }
  }

  init() {
    this.generateTOC();
    this.setupScrollSpy();
    this.setupSmoothScrolling();
  }

  generateTOC() {
    if (!this.tocContainer) return;

    // Find all headings (h2, h3, h4) in the content
    this.headings = Array.from(document.querySelectorAll("h2, h3, h4, h5"));

    // Clear existing TOC
    this.tocContainer.innerHTML = "";

    this.headings.forEach((heading, index) => {
      // Create an ID if it doesn't exist
      if (!heading.id) {
        heading.id = this.generateId(heading.textContent);
      }

      // Create TOC item
      const tocItem = this.createTocItem(heading);
      this.tocContainer.appendChild(tocItem);
    });
  }

  generateId(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .trim();
  }

  createTocItem(heading) {
    const li = document.createElement("li");
    const isSubItem = heading.tagName === "H3" || heading.tagName === "H5";

    li.className = isSubItem ? "toc-sub-item" : "toc-item";

    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.className = "toc-link";
    link.textContent = heading.textContent;
    link.dataset.target = heading.id;

    li.appendChild(link);
    return li;
  }

  setupScrollSpy() {
    // Create intersection observer to track visible sections
    const observerOptions = {
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all headings
    this.headings.forEach((heading) => {
      observer.observe(heading);
    });
  }

  setActiveSection(sectionId) {
    if (!this.tocContainer) return;

    // Remove active class from all TOC links
    const allLinks = this.tocContainer.querySelectorAll(".toc-link");
    allLinks.forEach((link) => link.classList.remove("active"));

    // Add active class to current section
    const activeLink = this.tocContainer.querySelector(
      `[data-target="${sectionId}"]`,
    );
    if (activeLink) {
      activeLink.classList.add("active");
      this.activeSection = sectionId;
    }
  }

  setupSmoothScrolling() {
    if (!this.tocContainer) return;

    // Add smooth scrolling to TOC links
    this.tocContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("toc-link")) {
        e.preventDefault();

        const targetId = e.target.getAttribute("href").substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Calculate offset to account for any fixed headers
          const offset = 20; // Adjust as needed
          const elementPosition =
            targetElement.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    });
  }

  // Method to refresh TOC if content changes dynamically
  refresh() {
    if (this.tocContainer) {
      this.generateTOC();
    }
  }
}

// Initialize TOC when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TableOfContents();
});

// Back to Top functionality
document.addEventListener("DOMContentLoaded", function () {
  const backToTopButton = document.getElementById("backToTop");

  if (backToTopButton) {
    // Show/hide button based on scroll position
    window.addEventListener("scroll", function () {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add("show");
      } else {
        backToTopButton.classList.remove("show");
      }
    });

    // Smooth scroll to top
    backToTopButton.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
});
