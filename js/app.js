let products = [];
let scanner = null;


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {
    try {
        const response = await fetch("./data/products.json");

        if (!response.ok) {
            throw new Error("Unable to load products.json");
        }

        products = await response.json();

        // Load saved stock from localStorage
        const stockData =
            JSON.parse(localStorage.getItem("stock_data")) || {};

        products.forEach(product => {

            if (
                stockData[product.product_code] !== undefined
            ) {
                product.quantity =
                    Number(stockData[product.product_code]);
            }

        });

        displayProducts();

    } catch (error) {

        console.error("Error loading products:", error);

        document.getElementById("products").innerHTML = `
            <h3>Unable to load products</h3>
            <p>Please check the browser console.</p>
        `;
    }
}


/* =========================
   DISPLAY PRODUCTS
========================= */

function displayProducts() {

    const container =
        document.getElementById("products");

    container.innerHTML = "";

    products.forEach(product => {

        const card =
            document.createElement("div");

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
            document.getElementById(
                `qr-${product.product_code}`
            ),
            {
                text: product.qr_code,
                width: 150,
                height: 150,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );

    });
}


/* =========================
   START QR SCANNER
========================= */

function startScanner() {

    scanner =
        new Html5Qrcode("reader");

    scanner.start(
        {
            facingMode: "environment"
        },
        {
            fps: 10,
            qrbox: 250
        },
        onScanSuccess,
        onScanError
    );
}


/* =========================
   QR SCAN SUCCESS
========================= */

function onScanSuccess(decodedText) {

    const product =
        products.find(
            p => p.qr_code === decodedText
        );


    if (!product) {

        document.getElementById(
            "scan-result"
        ).innerHTML = `
            <h3>Product not found</h3>
            <p>
                Scanned QR:
                ${decodedText}
            </p>
        `;

        return;
    }


    // Create audit entry for every successful scan
    createAuditLog(product);


    document.getElementById(
        "scan-result"
    ).innerHTML = `

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

        <button
            onclick="stockIn('${product.product_code}')">
            Add Stock
        </button>


        <h3>Stock Out</h3>

        <input
            type="number"
            id="stock-out-qty"
            min="1"
            value="1"
        >

        <button
            onclick="stockOut('${product.product_code}')">
            Remove Stock
        </button>


        <div id="stock-message"></div>
    `;


    if (scanner) {

        scanner.stop()
            .then(() => {
                console.log(
                    "Scanner stopped"
                );
            })
            .catch(error => {
                console.error(
                    "Scanner stop error:",
                    error
                );
            });

    }
}


/* =========================
   QR SCAN AUDIT
========================= */

function createAuditLog(product) {

    let auditLogs =
        JSON.parse(
            localStorage.getItem("audit_logs")
        ) || [];


    const auditId =
        auditLogs.length > 0
            ? auditLogs[
                auditLogs.length - 1
            ].audit_id + 1
            : 1;


    const auditRecord = {

        audit_id: auditId,

        timestamp:
            new Date().toISOString(),

        action: "QR_SCAN",

        qr_code:
            product.qr_code,

        product_code:
            product.product_code,

        product_name:
            product.product_name,

        quantity: 0,

        stock_before:
            product.quantity,

        stock_after:
            product.quantity

    };


    auditLogs.push(
        auditRecord
    );


    localStorage.setItem(
        "audit_logs",
        JSON.stringify(auditLogs)
    );


    console.log(
        "QR Scan Audit:",
        auditRecord
    );
}


/* =========================
   STOCK IN
========================= */

function stockIn(productCode) {

    const quantity =
        Number(
            document.getElementById(
                "stock-in-qty"
            ).value
        );


    if (!quantity || quantity <= 0) {

        showStockMessage(
            "Please enter a valid quantity."
        );

        return;
    }


    const product =
        products.find(
            p =>
                p.product_code ===
                productCode
        );


    if (!product) {

        showStockMessage(
            "Product not found."
        );

        return;
    }


    const stockBefore =
        product.quantity;


    product.quantity +=
        quantity;


    saveStock(product);

    updateDisplayedStock(
        product
    );


    createMovementAuditLog(
        product,
        "STOCK_IN",
        quantity,
        stockBefore,
        product.quantity
    );


    showStockMessage(
        `Stock added successfully. New stock: ${product.quantity}`
    );
}


/* =========================
   STOCK OUT
========================= */

function stockOut(productCode) {

    const quantity =
        Number(
            document.getElementById(
                "stock-out-qty"
            ).value
        );


    if (!quantity || quantity <= 0) {

        showStockMessage(
            "Please enter a valid quantity."
        );

        return;
    }


    const product =
        products.find(
            p =>
                p.product_code ===
                productCode
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


    const stockBefore =
        product.quantity;


    product.quantity -=
        quantity;


    saveStock(product);

    updateDisplayedStock(
        product
    );


    createMovementAuditLog(
        product,
        "STOCK_OUT",
        quantity,
        stockBefore,
        product.quantity
    );


    showStockMessage(
        `Stock removed successfully. New stock: ${product.quantity}`
    );
}


/* =========================
   SAVE STOCK
========================= */

function saveStock(product) {

    const stockData =
        JSON.parse(
            localStorage.getItem(
                "stock_data"
            )
        ) || {};


    stockData[
        product.product_code
    ] = product.quantity;


    localStorage.setItem(
        "stock_data",
        JSON.stringify(stockData)
    );


    console.log(
        "Stock saved:",
        stockData
    );
}


/* =========================
   MOVEMENT AUDIT
========================= */

function createMovementAuditLog(
    product,
    action,
    quantity,
    stockBefore,
    stockAfter
) {

    let auditLogs =
        JSON.parse(
            localStorage.getItem(
                "audit_logs"
            )
        ) || [];


    const auditId =
        auditLogs.length > 0
            ? auditLogs[
                auditLogs.length - 1
            ].audit_id + 1
            : 1;


    const auditRecord = {

        audit_id: auditId,

        timestamp:
            new Date().toISOString(),

        action: action,

        qr_code:
            product.qr_code,

        product_code:
            product.product_code,

        product_name:
            product.product_name,

        quantity: quantity,

        stock_before:
            stockBefore,

        stock_after:
            stockAfter

    };


    auditLogs.push(
        auditRecord
    );


    localStorage.setItem(
        "audit_logs",
        JSON.stringify(auditLogs)
    );


    console.log(
        "Movement Audit:",
        auditRecord
    );
}


/* =========================
   UPDATE DISPLAYED STOCK
========================= */

function updateDisplayedStock(
    product
) {

    const scannedStock =
        document.getElementById(
            "scanned-stock"
        );


    if (scannedStock) {

        scannedStock.textContent =
            product.quantity;
    }


    const productStock =
        document.getElementById(
            `stock-${product.product_code}`
        );


    if (productStock) {

        productStock.textContent =
            product.quantity;
    }
}


/* =========================
   STOCK MESSAGE
========================= */

function showStockMessage(
    message
) {

    const messageElement =
        document.getElementById(
            "stock-message"
        );


    if (messageElement) {

        messageElement.innerHTML = `
            <p>
                <strong>
                    ${message}
                </strong>
            </p>
        `;
    }
}


/* =========================
   SCANNER ERROR
========================= */

function onScanError(
    errorMessage
) {

    // Ignore continuous scanner errors

}


/* =========================
   INITIAL LOAD
========================= */

loadProducts();
