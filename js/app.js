let products = [];
let scanner = null;

async function loadProducts() {

    const response = await fetch("./data/products.json");

    products = await response.json();

    // Load previously updated stock from browser
    products.forEach(product => {

        const savedStock = localStorage.getItem(
            `stock_${product.product_code}`
        );

        if (savedStock !== null) {
            product.quantity = Number(savedStock);
        }

    });

    displayProducts();
}


function displayProducts() {

    const container = document.getElementById("products");

    container.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("div");

        card.innerHTML = `
            <h2>${product.product_name}</h2>

            <p>Product Code: ${product.product_code}</p>

            <p>QR Code: ${product.qr_code}</p>

            <p>Category: ${product.category}</p>

            <p>
                Current Stock:
                <strong id="stock-${product.product_code}">
                    ${product.quantity}
                </strong>
            </p>

            <p>Selling Price: ₹${product.selling_price}</p>

            <div class="qr-container"
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
                placeholder="Enter quantity"
            >

            <button onclick="stockIn('${product.product_code}')">
                Add Stock
            </button>

            <h3>Stock Out</h3>

            <input
                type="number"
                id="stock-out-qty"
                min="1"
                placeholder="Enter quantity"
            >

            <button onclick="stockOut('${product.product_code}')">
                Remove Stock
            </button>

            <div id="stock-message"></div>
        `;

        scanner.stop();

    } else {

        document.getElementById("scan-result").innerHTML = `
            <h3>Product not found</h3>
            <p>Scanned QR: ${decodedText}</p>
        `;
    }
}


function stockIn(productCode) {

    const quantity = Number(
        document.getElementById("stock-in-qty").value
    );

    if (!quantity || quantity <= 0) {

        showStockMessage("Please enter a valid quantity.");

        return;
    }

    const product = products.find(
        p => p.product_code === productCode
    );

    product.quantity += quantity;

    saveStock(product);

    updateDisplayedStock(product);

    showStockMessage(
        `Stock added successfully. New stock: ${product.quantity}`
    );
}


function stockOut(productCode) {

    const quantity = Number(
        document.getElementById("stock-out-qty").value
    );

    if (!quantity || quantity <= 0) {

        showStockMessage("Please enter a valid quantity.");

        return;
    }

    const product = products.find(
        p => p.product_code === productCode
    );

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

    document.getElementById("stock-message").innerHTML = `
        <p><strong>${message}</strong></p>
    `;
}


function onScanError(errorMessage) {
    // Ignore continuous scanning errors
}


loadProducts();
