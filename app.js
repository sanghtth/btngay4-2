class ProductDashboard {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    this.pageSize = 10;
    this.sortField = null;
    this.sortDirection = "asc";
    this.init();
  }

  init() {
    this.loadProducts();
    this.bindEvents();
  }

  async loadProducts() {
    try {
      const response = await fetch("https://api.escuelajs.co/api/v1/products");
      this.products = await response.json();
      this.filteredProducts = [...this.products];
      this.render();
    } catch (error) {
      console.error("Lỗi load products:", error);
      alert("Không thể tải dữ liệu sản phẩm");
    }
  }

  bindEvents() {
    // Search
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.search(e.target.value);
    });

    // Page size
    document.getElementById("pageSize").addEventListener("change", (e) => {
      this.pageSize = parseInt(e.target.value);
      this.currentPage = 1;
      this.render();
    });

    // Sort buttons
    document.querySelectorAll(".sort-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.sort(e.target.dataset.sort);
      });
    });

    // Export
    document.getElementById("exportBtn").addEventListener("click", () => {
      this.exportCSV();
    });

    // Create form
    document.getElementById("createForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.createProduct(e.target);
    });

    // Edit form
    document.getElementById("editForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.updateProduct(e.target);
    });

    // Detail modal
    document
      .getElementById("detailModal")
      .addEventListener("hidden.bs.modal", () => {
        document.getElementById("editBtn").style.display = "inline-block";
      });
  }

  search(query) {
    if (!query) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter((product) =>
        product.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    this.currentPage = 1;
    this.render();
  }

  sort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }

    this.filteredProducts.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      if (field === "price") {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) return this.sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    this.render();
  }

  render() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageProducts = this.filteredProducts.slice(start, end);

    this.renderTable(pageProducts);
    this.renderPagination();
  }

  renderTable(products) {
    const tbody = document.getElementById("productTableBody");
    tbody.innerHTML = products
      .map(
        (product) => `
            <tr data-product-id="${product.id}" 
                data-description="${product.description.replace(
                  /"/g,
                  "&quot;"
                )}">
                <td>${product.id}</td>
                <td class="title-cell" style="max-width: 200px; overflow: hidden;">${
                  product.title
                }</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td><span class="badge bg-primary">${
                  product.category?.name || "N/A"
                }</span></td>
                <td>
                    <img src="${product.images[0]}" alt="${product.title}" 
                         class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td>
                    <button class="btn btn-sm btn-info detail-btn" data-id="${
                      product.id
                    }">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");

    // Bind hover events
    document.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const desc = row.dataset.description;
        if (desc) {
          const tooltip = document.createElement("div");
          tooltip.className = "tooltip-description";
          tooltip.textContent = desc;
          row.appendChild(tooltip);
        }
      });

      row.addEventListener("mouseleave", () => {
        const tooltip = row.querySelector(".tooltip-description");
        if (tooltip) tooltip.remove();
      });
    });

    // Bind detail buttons
    document.querySelectorAll(".detail-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const productId = e.target.closest("button").dataset.id;
        this.showDetail(productId);
      });
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    const pagination = document.getElementById("pagination");

    let paginationHTML = "";
    if (totalPages > 1) {
      // Previous
      paginationHTML += `
                <li class="page-item ${
                  this.currentPage === 1 ? "disabled" : ""
                }">
                    <a class="page-link" href="#" data-page="${
                      this.currentPage - 1
                    }">Trước</a>
                </li>
            `;

      // Pages
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(totalPages, this.currentPage + 2);

      for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
                    <li class="page-item ${
                      i === this.currentPage ? "active" : ""
                    }">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
      }

      // Next
      paginationHTML += `
                <li class="page-item ${
                  this.currentPage === totalPages ? "disabled" : ""
                }">
                    <a class="page-link" href="#" data-page="${
                      this.currentPage + 1
                    }">Sau</a>
                </li>
            `;
    }

    pagination.innerHTML = paginationHTML;

    // Bind pagination events
    pagination.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.render();
        }
      });
    });
  }

  async showDetail(productId) {
    const product = this.products.find((p) => p.id == productId);
    if (!product) return;

    document.getElementById("modalTitle").textContent = product.title;
    document.getElementById("modalBody").innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <img src="${
                      product.images[0]
                    }" class="img-fluid rounded" alt="${product.title}">
                </div>
                <div class="col-md-8">
                    <h6>ID: ${product.id}</h6>
                    <h6>Price: $${parseFloat(product.price).toFixed(2)}</h6>
                    <h6>Category: ${product.category?.name || "N/A"}</h6>
                    <hr>
                    <h6>Description:</h6>
                    <p>${product.description}</p>
                </div>
            </div>
        `;

    // Store product for edit
    document.querySelector('#editForm [name="id"]').value = product.id;
    document.querySelector('#editForm [name="title"]').value = product.title;
    document.querySelector('#editForm [name="price"]').value = product.price;
    document.querySelector('#editForm [name="description"]').value =
      product.description;
    document.querySelector('#editForm [name="category"]').value =
      product.category?.name || "";
    document.querySelector('#editForm [name="images\\[0\\]"]').value =
      product.images[0];

    const modal = new bootstrap.Modal(document.getElementById("detailModal"));
    modal.show();

    document.getElementById("editBtn").onclick = () => {
      document
        .getElementById("detailModal")
        .querySelector(".btn-close")
        .click();
      setTimeout(() => {
        const editModal = new bootstrap.Modal(
          document.getElementById("editModal")
        );
        editModal.show();
      }, 300);
    };
  }

  async createProduct(form) {
    const formData = new FormData(form);
    const productData = {
      title: formData.get("title"),
      price: parseFloat(formData.get("price")),
      description: formData.get("description"),
      categoryId: 1, // Default category
      images: [formData.get("images[0]")],
    };

    try {
      const response = await fetch("https://api.escuelajs.co/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        bootstrap.Modal.getInstance(
          document.getElementById("createModal")
        ).hide();
        form.reset();
        this.loadProducts(); // Reload data
        alert("Tạo sản phẩm thành công!");
      }
    } catch (error) {
      alert("Lỗi tạo sản phẩm: " + error.message);
    }
  }

  async updateProduct(form) {
    const formData = new FormData(form);
    const productId = formData.get("id");
    const productData = {
      title: formData.get("title"),
      price: parseFloat(formData.get("price")),
      description: formData.get("description"),
      categoryId: 1,
      images: [formData.get("images[0]")],
    };

    try {
      const response = await fetch(
        `https://api.escuelajs.co/api/v1/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        }
      );

      if (response.ok) {
        bootstrap.Modal.getInstance(
          document.getElementById("editModal")
        ).hide();
        this.loadProducts();
        alert("Cập nhật thành công!");
      }
    } catch (error) {
      alert("Lỗi cập nhật: " + error.message);
    }
  }

  exportCSV() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageProducts = this.filteredProducts.slice(start, end);

    const csv = [
      ["ID", "Title", "Price", "Category", "Description"],
      ...pageProducts.map((p) => [
        p.id,
        `"${p.title}"`,
        p.price,
        p.category?.name || "N/A",
        `"${p.description}"`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_page_${this.currentPage}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

// Add CSS for tooltip
const style = document.createElement("style");
style.textContent = `
    .tooltip-description {
        position: absolute;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        max-width: 300px;
        z-index: 1000;
        left: 0;
        top: 100%;
        margin-top: 5px;
        white-space: normal;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    tr:hover .tooltip-description {
        display: block;
    }
`;
document.head.appendChild(style);

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  new ProductDashboard();
});
