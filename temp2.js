const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Profile.jsx', 'utf8');

if (!code.includes('const [expandedOrderId, setExpandedOrderId] = useState(null);')) {
  code = code.replace(
    /const \[activeTab, setActiveTab\] = useState\('orders'\);/,
    "const [activeTab, setActiveTab] = useState('orders');\n    const [expandedOrderId, setExpandedOrderId] = useState(null);"
  );
}

const oldChunk = `                                        <div className="prf-order-head">
                                            <div>
                                                <div className="prf-order-id">#{order._id.slice(-6).toUpperCase()}</div>
                                                <div className="prf-order-date">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            <StatusPill status={order.status} />
                                        </div>

                                        <div className="prf-order-body">
                                            <div className="prf-order-shop">
                                                🏪 {order.shopId?.name || "Local Shop"}
                                            </div>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="prf-order-item">
                                                    <span>
                                                        <span className="prf-item-qty">{item.quantity}×</span>
                                                        {item.name}
                                                    </span>
                                                    <span className="prf-item-price">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="prf-order-foot">
                                            <div className="prf-total-label">Total Amount</div>
                                            <div className="prf-total-val">₹{order.totalAmount}</div>
                                        </div>`;

const newChunk = `                                        <div className="prf-order-head" style={{cursor: "pointer", position: "relative"}} onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}>
                                            <div style={{display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "8px"}}>
                                                <div style={{fontSize: "14px", fontWeight: "600", color: "#1e293b"}}>Order from: {order.shopId?.name || "Local Shop"}</div>
                                                <div style={{fontSize: "18px", color: "#64748b"}}>{expandedOrderId === order._id ? "▲" : "▼"}</div>
                                            </div>
                                            <div style={{display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center"}}>
                                                <div>
                                                    <div className="prf-order-id">#{order._id.slice(-6).toUpperCase()}</div>
                                                    <div className="prf-order-date">
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'short',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                                <StatusPill status={order.status} />
                                            </div>
                                        </div>

                                        {expandedOrderId === order._id && (
                                            <>
                                                <div className="prf-order-body">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="prf-order-item">
                                                            <span>
                                                                <span className="prf-item-qty">{item.quantity}×</span>
                                                                {item.name}
                                                            </span>
                                                            <span className="prf-item-price">₹{item.price * item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="prf-order-foot">
                                                    <div className="prf-total-label">Total Amount</div>
                                                    <div className="prf-total-val">₹{order.totalAmount}</div>
                                                </div>
                                            </>
                                        )}`;

code = code.replace(oldChunk, newChunk);
fs.writeFileSync('frontend/src/pages/Profile.jsx', code);
