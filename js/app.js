let products = [];
let scanner = null;

async function loadProducts() {
    try {
        const response = await fetch("./data/products.json");

        if (!response.ok) {
            throw new Error("Unable to load products.json");
        }

        products = await response.json();

        // Load previously updated stock from browser localStorage
        products.forEach(product => {

            const savedStock = localStorage.getItem(
                `stock_${product.product_code}`
            );

            if (savedStock !== null) {
                product.quantity = Number(savedStock);
            }

        });

        displayProducts();

    } catch (error) {

        console.error("Error loading products:", error);

        document.getElementById("products").innerHTML = `
            <h3>Unable to load products</h3>
            <p>Please check the browser console for details.</p>
        `;
    }
}


function displayProducts() {

    const container = document.getElementById("products");

    container.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("div");

        card.innerHTML = `
            <h2>${product.product_name}</h2>

            <p>
                Product Code:
                ${product.product_code}
            </p>

            <p>
                QR Code:
                ${product.qr_code}
            </p>

            <p>
                Category:
                ${product.category}
            </p>

            <p>
                Current Stock:
                <strong id="stock-${product.product_code}">
                    ${product.quantity}
                </strong>
            </p>

            <p>
                Selling Price:
                ₹${product.selling_price}
            </p>

            <div
                class="qr-container"
                id="qr-${product.product_code}">
            </div>
        `;

        container.appendChild(card);

        new QRCode(
            document.getElementById(`qr-${product.product_code}`),
            {
                text: product.qr_code,
                width: 150,
                height: 150,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            }
        );
    });
}


function startScanner() {

    scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        onScanSuccess,
        onScanError
    );
}


function onScanSuccess(decodedText) {

    const product = products.find(
        p => p.qr_code === decodedText
    );

    if (product) {

        document.getElementById("scan-result").innerHTML = `

            <h2>Product Found</h2>

            <p>
                <strong>Product:</strong>
                ${product.product_name}
            </p>

            <p>
                <strong>Product Code:</strong>
                ${product.product_code}
            </p>

            <p>
                <strong>Category:</strong>
                ${product.category}
            </p>

            <p>
                <strong>Current Stock:</strong>
                <span id="scanned-stock">
                    ${product.quantity}
                </span>
            </p>

            <p>
                <strong>Selling Price:</strong>
                ₹${product.selling_price}
            </p>

            <hr>

            <h3>Stock In</h3>

            <input
                type="number"
                id="stock-in-qty"
                min="1"
                value="1"
            >

            <button onclick="stockIn('${product.product_code}')">
                Add Stock
            </button>

            <h3>Stock Out</h3>

            <input
                type="number"
                id="stock-out-qty"
                min="1"
                value="1"
            >

            <button onclick="stockOut('${product.product_code}')">
                Remove Stock
            </button>

            <div id="stock-message"></div>
        `;

        if (scanner) {
            scanner.stop()
                .then(() => {
                    console.log("Scanner stopped");
                })
                .catch(error => {
                    console.error("Scanner stop error:", error);
                });
        }

    } else {

        document.getElementById("scan-result").innerHTML = `
            <h3>Product not found</h3>
            <p>Scanned QR: ${decodedText}</p>
        `;
    }
}


function stockIn(productCode) {

    const input = document.getElementById("stock-in-qty");

    const quantity = Number(input.value);

    if (!quantity || quantity <= 0) {

        showStockMessage(
            "Please enter a valid quantity."
        );

        return;
    }

    const product = products.find(
        p => p.product_code === productCode
    );

    if (!product) {

        showStockMessage(
            "Product not found."
        );

        return;
    }

    product.quantity += quantity;

    saveStock(product);

    updateDisplayedStock(product);

    showStockMessage(
        `Stock added successfully. New stock: ${product.quantity}`
    );
}


function stockOut(productCode) {

    const input = document.getElementById("stock-out-qty");

    const quantity = Number(input.value);

    if (!quantity || quantity <= 0) {

        showStockMessage(
            "Please enter a valid quantity."
        );

        return;
    }

    const product = products.find(
        p => p.product_code === productCode
    );

    if (!product) {

        showStockMessage(
            "Product not found."
        );

        return;
    }

    if (quantity > product.quantity) {

        showStockMessage(
            `Insufficient stock. Available stock: ${product.quantity}`
        );

        return;
    }

    product.quantity -= quantity;

    saveStock(product);

    updateDisplayedStock(product);

    showStockMessage(
        `Stock removed successfully. New stock: ${product.quantity}`
    );
}


function saveStock(product) {

    localStorage.setItem(
        `stock_${product.product_code}`,
        product.quantity
    );
}


function updateDisplayedStock(product) {

    const scannedStock =
        document.getElementById("scanned-stock");

    if (scannedStock) {
        scannedStock.textContent = product.quantity;
    }

    const productStock =
        document.getElementById(
            `stock-${product.product_code}`
        );

    if (productStock) {
        productStock.textContent = product.quantity;
    }
}


function showStockMessage(message) {

    const messageElement =
        document.getElementById("stock-message");

    if (messageElement) {

        messageElement.innerHTML = `
            <p>
                <strong>${message}</strong>
            </p>
        `;
    }
}


function onScanError(errorMessage) {

    // Ignore continuous scanning errors
}


loadProducts();
