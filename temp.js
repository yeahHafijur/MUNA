const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/VendorDashboard.jsx', 'utf8');

if (!code.includes('const [expandedOrderId, setExpandedOrderId] = useState(null);')) {
  code = code.replace(
    /const \[isAddingItem, setIsAddingItem\] = useState\(false\);/,
    "const [isAddingItem, setIsAddingItem] = useState(false);\n    const [expandedOrderId, setExpandedOrderId] = useState(null);"
  );
}

// Inject onClick to head and customer name
const headRegex = /<div className="vnd-order-head">([\s\S]*?)<div className="vnd-order-body">/g;

code = code.replace(headRegex, (match, p1) => {
  // Add onClick and cursor pointer
  let newMatch = match.replace('<div className="vnd-order-head">', '<div className="vnd-order-head" style={{cursor: "pointer"}} onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}>\n                                            <div style={{width:"100%", display:"flex", justifyContent:"space-between"}}>\n                                                <div style={{fontSize:"14px", fontWeight:"600", color:"#1e293b", marginBottom:"4px"}}>Order from: {order.customerId?.name || "Guest"}</div>\n                                                <div style={{fontSize:"18px", color:"#64748b"}}>{expandedOrderId === order._id ? "▲" : "▼"}</div>\n                                            </div>\n                                            <div style={{display:"flex", justifyContent:"space-between", width:"100%"}}>');
  
  // Close the flex div we just added before vnd-order-body
  newMatch = newMatch.replace('<div className="vnd-order-body">', '</div>\n                                        </div>\n                                        {expandedOrderId === order._id && (\n                                        <div className="vnd-order-body">');
  return newMatch;
});

// Close the if statement after vnd-order-foot
const footRegex = /<\/div>\s*<\/div>\s*\}\)\}\s*<\/div>/;
code = code.replace(/<\/select>\s*<\/div>\s*<\/div>/g, '</select>\n                                        </div>\n                                        )}\n                                    </div>');

fs.writeFileSync('frontend/src/pages/VendorDashboard.jsx', code);
