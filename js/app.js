let products = [];
let scanner = null;

async function loadProducts() {

    const response = await fetch("./data/products.json");

    products = await response.json();

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

            <p>Current Stock: ${product.quantity}</p>

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

            <p><strong>Product:</strong>
                ${product.product_name}
            </p>

            <p><strong>Product Code:</strong>
                ${product.product_code}
            </p>

            <p><strong>Category:</strong>
                ${product.category}
            </p>

            <p><strong>Current Stock:</strong>
                ${product.quantity}
            </p>

            <p><strong>Selling Price:</strong>
                ₹${product.selling_price}
            </p>
        `;

        scanner.stop();

    } else {

        document.getElementById("scan-result").innerHTML = `
            <h3>Product not found</h3>
            <p>Scanned QR: ${decodedText}</p>
        `;
    }
}


function onScanError(errorMessage) {
    // Ignore continuous scanning errors
}


loadProducts();
