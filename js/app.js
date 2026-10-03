async function loadProducts() {

    const response = await fetch("data/products.json");

    const products = await response.json();

    const container = document.getElementById("products");

    products.forEach(product => {

        const card = document.createElement("div");

        card.innerHTML = `
            <h2>${product.product_name}</h2>

            <p>
                Product Code: ${product.product_code}
            </p>

            <p>
                QR Code: ${product.qr_code}
            </p>

            <p>
                Category: ${product.category}
            </p>

            <p>
                Current Stock: ${product.quantity}
            </p>

            <p>
                Selling Price: ₹${product.selling_price}
            </p>

            <div id="qr-${product.product_code}"></div>
        `;

        container.appendChild(card);

        // Generate QR code
        new QRCode(
            document.getElementById(`qr-${product.product_code}`),
            {
                text: product.qr_code,
                width: 150,
                height: 150
            }
        );

    });
}


function startScanner() {

    const scanner = new Html5Qrcode("reader");

    scanner.start(

        { facingMode: "environment" },

        {
            fps: 10,
            qrbox: 250
        },

        (decodedText) => {

            document.getElementById("scan-result").innerHTML =
                `<h3>Scanned QR: ${decodedText}</h3>`;

            scanner.stop();

        },

        (errorMessage) => {

            // Ignore scanning errors

        }

    );
}


loadProducts();
