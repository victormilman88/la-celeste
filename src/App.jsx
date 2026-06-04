import { useState, useRef } from "react";

const WHATSAPP_NUMBER = "5553991321557";
const GOOGLE_MAPS_API_KEY = "AIzaSyAmNw6R38YWVm9qT9QcdeDvpMdMEs-pnzY";
const PIZZARIA_LAT = -31.7654;
const PIZZARIA_LNG = -52.3376;
const PROXY = `/api/places`;

const FAIXAS_FRETE = [
  { ate: 1,   taxa: 6,   label: "até 1 km" },
  { ate: 2.5, taxa: 8,   label: "até 2,5 km" },
  { ate: 4,   taxa: 10,  label: "até 4 km" },
  { ate: 5.5, taxa: 12,  label: "até 5,5 km" },
  { ate: 7,   taxa: 15,  label: "até 7 km" },
  { ate: 9,   taxa: 18,  label: "até 9 km" },
  { ate: 10,  taxa: 20,  label: "até 10 km" },
  { ate: 13,  taxa: 25,  label: "até 13 km" },
  { ate: 999, taxa: null, label: "acima de 13 km" },
];

function calcularFrete(km) {
  return FAIXAS_FRETE.find(f => km <= f.ate) || FAIXAS_FRETE[FAIXAS_FRETE.length - 1];
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmt(n) { return "R$ " + Number(n).toFixed(2).replace(".", ","); }

const MENU = {
  pizzas: [
    // Salgadas
    { id: 1,  nome: "Mussarela c/ pesto uruguaio",      desc: "Molho de tomate, mussarela e pesto uruguaio", preco: 34, secao: "Salgadas" },
    { id: 2,  nome: "Marguerita",                        desc: "Molho de tomate, mussarela, tomate cereja, pesto e manjericão", preco: 35, secao: "Salgadas" },
    { id: 3,  nome: "Calabresa",                         desc: "Molho de tomate, mussarela, calabresa, catupiry e orégano", preco: 35, secao: "Salgadas" },
    { id: 4,  nome: "Pepperoni",                         desc: "Molho de tomate, mussarela, pepperoni, catupiry e orégano", preco: 36, secao: "Salgadas" },
    { id: 5,  nome: "5 Queijos",                         desc: "Molho de tomate, mussarela, provolone, gorgonzola, prato, cheddar e orégano", preco: 39, secao: "Salgadas" },
    { id: 6,  nome: "Alcatra c/ gorgonzola",             desc: "Molho de tomate, mussarela, alcatra, gorgonzola e orégano", preco: 39, secao: "Salgadas" },
    { id: 7,  nome: "4 Queijos c/ alcatra",              desc: "Molho de tomate, mussarela, alcatra, prato, provolone, cheddar e orégano", preco: 39, secao: "Salgadas" },
    { id: 8,  nome: "Vazio c/ cebola caramelizada",      desc: "Molho de tomate, mussarela, vazio e cebola caramelizada", preco: 39, secao: "Salgadas" },
    { id: 9,  nome: "Entrecot c/ chimichurri",           desc: "Molho de tomate, mussarela, entrecot, catupiry e chimichurri", preco: 42, secao: "Salgadas" },
    { id: 10, nome: "Presunto parma c/ geleia de figo",  desc: "Molho de tomate, mussarela, presunto parma e geleia de figo", preco: 48, secao: "Salgadas" },
    // Doces
    { id: 11, nome: "Doce de leite Conaprole",           desc: "Doce de leite Conaprole e mussarela", preco: 36, secao: "Doces" },
    { id: 12, nome: "Chocolate c/ castanha de caju",     desc: "Chocolate ao leite ou branco, mussarela e castanha de caju", preco: 36, secao: "Doces" },
    { id: 13, nome: "Chocolate c/ MM's",                 desc: "Chocolate ao leite ou branco e confeito MM's", preco: 36, secao: "Doces" },
  ],
  congeladas: [
    { id: 14, nome: "Marguerita",       desc: "Pizza congelada individual", preco: 28, secao: "Clássicas" },
    { id: 15, nome: "Calabresa",        desc: "Pizza congelada individual", preco: 28, secao: "Clássicas" },
    { id: 16, nome: "Pepperoni",        desc: "Pizza congelada individual", preco: 32, secao: "Clássicas" },
    { id: 17, nome: "5 Queijos",        desc: "Pizza congelada individual", preco: 35, secao: "Especiais" },
    { id: 18, nome: "Alcatra c/ gorgonzola", desc: "Pizza congelada individual", preco: 35, secao: "Especiais" },
    { id: 19, nome: "4 Queijos c/ alcatra", desc: "Pizza congelada individual", preco: 35, secao: "Especiais" },
    { id: 20, nome: "Vazio c/ cebola caramelizada", desc: "Pizza congelada individual", preco: 35, secao: "Especiais" },
    { id: 21, nome: "Entrecot c/ chimichurri", desc: "Pizza congelada individual", preco: 35, secao: "Especiais" },
    { id: 22, nome: "Chocolate branco c/ castanha", desc: "Pizza doce congelada individual", preco: 30, secao: "Doces" },
    { id: 23, nome: "Doce de leite Conaprole", desc: "Pizza doce congelada individual", preco: 30, secao: "Doces" },
  ],
  cervejas: [
    { id: 30, nome: "Heineken",         desc: "Long neck", preco: 13 },
    { id: 31, nome: "Corona",           desc: "Long neck", preco: 13 },
    { id: 32, nome: "Patricia",         desc: "Long neck", preco: 14 },
    { id: 33, nome: "Heineken s/ álcool", desc: "Long neck", preco: 13 },
    { id: 34, nome: "Norteña",          desc: "Latão", preco: 14 },
    { id: 35, nome: "Patricia",         desc: "Latão", preco: 18 },
    { id: 36, nome: "Zillertal",        desc: "Latão", preco: 20 },
    { id: 37, nome: "Zillertal IPA",    desc: "Latão", preco: 24 },
    { id: 38, nome: "Pilsen s/ álcool", desc: "Latão", preco: 16 },
  ],
  vinhos: [
    { id: 40, nome: "Juan Carrau Chardonnay",         desc: "Branco · Bodegas Carrau, Canelones, Uruguai · 750ml", preco: 80 },
    { id: 41, nome: "Juan Carrau Tannat",             desc: "Tinto · Bodegas Carrau, Canelones, Uruguai · 750ml", preco: 80 },
    { id: 42, nome: "Juan Carrau Malbec",             desc: "Tinto · Bodegas Carrau, Canelones, Uruguai · 750ml", preco: 80 },
    { id: 43, nome: "Juan Carrau Cabernet Sauvignon", desc: "Tinto · Bodegas Carrau, Canelones, Uruguai · 750ml", preco: 80 },
    { id: 44, nome: "Don Pascual Tannat Reserva",     desc: "Tinto · Establecimiento Juanicó, Canelones, Uruguai · 750ml", preco: 90 },
  ],
  aguas: [
    { id: 50, nome: "Água com gás",    desc: "500ml", preco: 4 },
    { id: 51, nome: "Água sem gás",    desc: "500ml", preco: 4 },
    { id: 52, nome: "Coca-Cola",       desc: "Lata 350ml", preco: 7 },
    { id: 53, nome: "Coca-Cola Zero",  desc: "Lata 350ml", preco: 7 },
    { id: 54, nome: "Guaraná Fruki",   desc: "Lata 350ml", preco: 7 },
    { id: 55, nome: "Guaraná Fruki Zero", desc: "Lata 350ml", preco: 7 },
    { id: 56, nome: "Sprite",          desc: "Lata 350ml", preco: 7 },
    { id: 57, nome: "Sprite Zero",     desc: "Lata 350ml", preco: 7 },
  ],
};

const CATEGORIAS_CARDAPIO = [
  { key: "pizzas",    label: "🍕 Pizzas" },
  { key: "congeladas",label: "🧊 Congeladas" },
  { key: "aguas",     label: "🥤 Bebidas" },
  { key: "cervejas",  label: "🍺 Cervejas" },
  { key: "vinhos",    label: "🍷 Vinhos" },
];

const STATUS_CONFIG = {
  recebido: { label: "Recebido",   color: "#b45309", bg: "#fef3c7" },
  preparo:  { label: "Em preparo", color: "#1d4ed8", bg: "#dbeafe" },
  pronto:   { label: "Pronto! ✓", color: "#065f46", bg: "#d1fae5" },
  entregue: { label: "Entregue",   color: "#6b7280", bg: "#f3f4f6" },
};

let nextId = 1;

export default function LaCelesteApp() {
  // App mode: home | delivery | local | eventos | painel
  const [appMode, setAppMode] = useState("home");
  const [categoria, setCategoria] = useState("pizzas");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);

  // Delivery checkout
  const [showCart, setShowCart] = useState(false);
  const [step, setStep] = useState(1);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTel, setClienteTel] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState(null);
  const [endereco, setEndereco] = useState("");
  const [complemento, setComplemento] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [distanciaInfo, setDistanciaInfo] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [erroEnd, setErroEnd] = useState("");
  const [obs, setObs] = useState("");
  const [pagamento, setPagamento] = useState(null);
  const [troco, setTroco] = useState("");

  // Local order
  const [localNome, setLocalNome] = useState("");
  const [localMesa, setLocalMesa] = useState("");
  const [localPag, setLocalPag] = useState(null);
  const [showLocalCart, setShowLocalCart] = useState(false);

  // Evento
  const [evNome, setEvNome] = useState("");
  const [evTel, setEvTel] = useState("");
  const [evData, setEvData] = useState("");
  const [evLocal, setEvLocal] = useState("");
  const [evAdultos, setEvAdultos] = useState("");
  const [evMeias, setEvMeias] = useState("");
  const [evCortesia, setEvCortesia] = useState("");
  const [evObs, setEvObs] = useState("");

  const debounceRef = useRef(null);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  function addToCart(item) {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === item.id);
      if (ex) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { uid: Date.now() + Math.random(), item, qty: 1 }];
    });
    showToast(item.nome + " adicionado!");
  }

  function updateQty(uid, delta) {
    setCart(prev => prev.map(c => c.uid === uid ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  }

  const subtotal = cart.reduce((s, c) => s + c.item.preco * c.qty, 0);
  const taxaEntrega = (tipoEntrega === "entrega" && distanciaInfo?.faixa?.taxa != null) ? distanciaInfo.faixa.taxa : 0;
  const total = subtotal + taxaEntrega;
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  // Autocomplete
  function handleEnderecoInput(val) {
    setEndereco(val); setDistanciaInfo(null); setErroEnd("");
    clearTimeout(debounceRef.current);
    if (!val || val.length < 3) { setSugestoes([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const input = encodeURIComponent(val + " Pelotas RS Brasil");
        const res = await fetch(`${PROXY}?input=${input}`);
        const data = await res.json();
        if (data.status === "OK") setSugestoes(data.predictions.slice(0, 6));
        else setSugestoes([]);
      } catch(e) { setSugestoes([]); }
    }, 400);
  }

  async function selecionarSugestao(s) {
    setSugestoes([]); setCalculando(true); setErroEnd(""); setDistanciaInfo(null);
    setEndereco(s.description);
    try {
      const res = await fetch(`${PROXY}?place_id=${s.place_id}`);
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const km = haversineKm(PIZZARIA_LAT, PIZZARIA_LNG, lat, lng);
        const faixa = calcularFrete(km);
        setEndereco(data.results[0].formatted_address || s.description);
        setDistanciaInfo({ km: km.toFixed(1), faixa, lat, lng });
        if (faixa.taxa === null) setErroEnd("Fora da área de entrega (acima de 13 km).");
      } else setErroEnd("Endereço não encontrado.");
    } catch(e) { setErroEnd("Erro ao calcular distância."); }
    setCalculando(false);
  }

  // Delivery order
  function confirmDelivery() {
    const isRetirada = tipoEntrega === "retirada";
    let msg = "☀ *Pedido La Celeste*\n\n";
    msg += "👤 *Cliente:* " + clienteNome + "\n";
    msg += "📱 *WhatsApp:* " + clienteTel + "\n\n";
    msg += "🍕 *Itens:*\n";
    cart.forEach(c => {
      const isCongelada = c.item.id >= 14 && c.item.id <= 23;
      msg += "• " + (c.qty > 1 ? c.qty + "× " : "") + c.item.nome + (isCongelada ? " ❄️" : "") + " — " + fmt(c.item.preco * c.qty) + "\n";
    });
    msg += "\n💰 *Subtotal:* " + fmt(subtotal) + "\n";
    if (isRetirada) {
      msg += "🏠 *Retirada* — Av. JK, 4165\n";
    } else {
      msg += "🚗 *Entrega:* " + endereco + (complemento ? " — " + complemento : "") + "\n";
      if (distanciaInfo) msg += "📏 ~" + distanciaInfo.km + " km · Taxa: " + fmt(distanciaInfo.faixa.taxa) + "\n";
    }
    msg += "💳 *Pagamento:* " + (pagamento === "dinheiro" ? "Dinheiro" + (troco ? " (troco p/ R$ " + troco + ")" : "") : pagamento === "pix" ? "PIX" : "Cartão") + "\n";
    msg += "\n✅ *Total:* " + fmt(total) + "\n";
    if (obs) msg += "\n📝 *Obs:* " + obs + "\n";
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
    setOrders(prev => [{ id: nextId++, cliente: clienteNome, mesa: isRetirada ? "Retirada" : distanciaInfo?.km + " km", itens: [...cart], obs, status: "recebido", hora: new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}), total, tipoEntrega }, ...prev]);
    setCart([]); setClienteNome(""); setClienteTel(""); setTipoEntrega(null); setEndereco(""); setComplemento(""); setDistanciaInfo(null); setObs(""); setPagamento(null); setTroco(""); setShowCart(false); setStep(1);
    showToast("Pedido enviado! 🎉");
  }

  // Local order
  function confirmLocal() {
    let msg = "☀ *Pedido — Consumo Local*\n\n";
    msg += "👤 *Cliente:* " + localNome + "\n";
    msg += "🪑 *Mesa/Local:* " + localMesa + "\n\n";
    msg += "🍕 *Itens:*\n";
    cart.forEach(c => { msg += "• " + (c.qty > 1 ? c.qty + "× " : "") + c.item.nome + " — " + fmt(c.item.preco * c.qty) + "\n"; });
    msg += "\n💰 *Total:* " + fmt(subtotal) + "\n";
    msg += "💳 *Pagamento:* " + (localPag === "pix" ? "PIX" : "Retirar no caixa") + "\n";
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
    setOrders(prev => [{ id: nextId++, cliente: localNome, mesa: "Mesa " + localMesa, itens: [...cart], obs: "", status: "recebido", hora: new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}), total: subtotal, tipoEntrega: "local" }, ...prev]);
    setCart([]); setLocalNome(""); setLocalMesa(""); setLocalPag(null); setShowLocalCart(false);
    showToast("Pedido enviado! 🎉");
  }

  // Evento
  const evAdultosN = parseInt(evAdultos) || 0;
  const evMeiasN = parseInt(evMeias) || 0;
  const evCortesiaN = parseInt(evCortesia) || 0;
  const evTotal = evAdultosN * 50 + evMeiasN * 25 + 200; // +taxa transporte
  const evTotalPessoas = evAdultosN + evMeiasN + evCortesiaN;

  function enviarEvento() {
    let msg = "🎉 *Interesse em Evento — La Celeste Pizza*\n\n";
    msg += "👤 *Nome:* " + evNome + "\n";
    msg += "📱 *WhatsApp:* " + evTel + "\n";
    msg += "📅 *Data do evento:* " + evData + "\n";
    msg += "📍 *Local:* " + (evLocal || "A definir") + "\n\n";
    msg += "👥 *Participantes:*\n";
    msg += "• Adultos (acima de 13 anos): " + evAdultosN + " × R$ 50 = " + fmt(evAdultosN * 50) + "\n";
    msg += "• Crianças 6-12 anos: " + evMeiasN + " × R$ 25 = " + fmt(evMeiasN * 25) + "\n";
    msg += "• Até 5 anos (cortesia): " + evCortesiaN + "\n";
    msg += "• Total de pessoas: " + evTotalPessoas + "\n\n";
    msg += "🚗 *Taxa de serviço/transporte:* R$ 200,00\n";
    msg += "💰 *Estimativa total:* " + fmt(evTotal) + "\n";
    if (evObs) msg += "\n📝 *Observações:* " + evObs + "\n";
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
    setEvNome(""); setEvTel(""); setEvData(""); setEvLocal(""); setEvAdultos(""); setEvMeias(""); setEvCortesia(""); setEvObs("");
    showToast("Solicitação enviada! 🎉");
  }

  const active = orders.filter(o => o.status !== "entregue");
  const done = orders.filter(o => o.status === "entregue");

  const canDeliveryStep1 = clienteNome.trim().length > 1 && clienteTel.replace(/\D/g,"").length >= 10;
  const canDeliveryStep2 = tipoEntrega === "retirada" || (tipoEntrega === "entrega" && distanciaInfo && distanciaInfo.faixa.taxa !== null);
  const canDeliveryStep3 = !!pagamento;
  const canLocal = localNome.trim() && localMesa.trim() && localPag && cart.length > 0;
  const canEvento = evNome && evTel && evData && evLocal && evAdultosN >= 25;

  // Render sections for pizza menu
  function renderMenuSection(items) {
    const sections = [...new Set(items.map(i => i.secao).filter(Boolean))];
    if (sections.length <= 1) {
      return items.map(item => renderMenuItem(item));
    }
    return sections.map(secao => (
      <div key={secao}>
        <div style={{fontSize:11,fontWeight:800,color:"#4a90c4",textTransform:"uppercase",letterSpacing:1.5,padding:"12px 0 6px"}}>{secao}</div>
        {items.filter(i => i.secao === secao).map(item => renderMenuItem(item))}
      </div>
    ));
  }

  function renderMenuItem(item) {
    return (
      <div key={item.id} className="card">
        <div style={{flex:1}}>
          <div className="card-name">{item.nome}</div>
          <div className="card-desc">{item.desc}</div>
          <div className="card-price">{fmt(item.preco)}</div>
        </div>
        <button className="add-btn" onClick={() => addToCart(item)}>+</button>
      </div>
    );
  }

  function advance(id) {
    const steps = ["recebido","preparo","pronto","entregue"];
    setOrders(prev => prev.map(o => o.id !== id ? o : { ...o, status: steps[Math.min(steps.indexOf(o.status)+1,3)] }));
  }

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",minHeight:"100vh",background:"#f0f6fc",color:"#1a3a5c"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{cursor:pointer;border:none;background:none;font-family:inherit;}
        input,textarea,select{font-family:inherit;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#c5dff0;border-radius:4px;}

        .header{background:#1a3a5c;padding:0 16px;position:sticky;top:0;z-index:50;}
        .header-inner{max-width:680px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:58px;}
        .logo-text{font-family:'Playfair Display',serif;color:#f5c518;font-size:22px;letter-spacing:1px;}
        .logo-sub{font-size:10px;color:#7fb3d5;letter-spacing:2px;text-transform:uppercase;}

        .tab-btn{padding:7px 14px;border-radius:100px;font-size:13px;font-weight:700;color:#7fb3d5;transition:all .18s;position:relative;}
        .tab-btn.active{background:#4a90c4;color:#fff;}
        .tab-btn:hover:not(.active){color:#fff;}

        .cat-scroll{display:flex;gap:8px;overflow-x:auto;padding:14px 16px 2px;scrollbar-width:none;}
        .cat-scroll::-webkit-scrollbar{display:none;}
        .cat-btn{padding:7px 16px;border-radius:100px;font-size:13px;font-weight:700;border:2px solid #c5dff0;color:#4a90c4;background:#fff;white-space:nowrap;transition:all .15s;}
        .cat-btn.active{background:#4a90c4;color:#fff;border-color:#4a90c4;}

        .card{background:#fff;border-radius:14px;border:1px solid #daeaf7;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;transition:box-shadow .15s;}
        .card:hover{box-shadow:0 4px 14px rgba(74,144,196,.12);}
        .card-name{font-weight:800;font-size:14px;color:#1a3a5c;margin-bottom:2px;}
        .card-desc{font-size:12px;color:#7a9ab5;line-height:1.4;}
        .card-price{font-size:15px;font-weight:800;color:#4a90c4;margin-top:4px;}
        .add-btn{background:#4a90c4;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;flex-shrink:0;transition:background .15s;}
        .add-btn:hover{background:#1a3a5c;}

        .btn-primary{background:#4a90c4;color:#fff;border-radius:12px;padding:13px 24px;font-size:15px;font-weight:800;transition:background .15s;width:100%;}
        .btn-primary:hover{background:#1a3a5c;}
        .btn-primary:disabled{background:#b0cfe4;cursor:not-allowed;}
        .btn-wpp{background:#25D366;color:#fff;border-radius:12px;padding:13px 24px;font-size:15px;font-weight:800;transition:background .15s;width:100%;}
        .btn-wpp:hover{background:#128C7E;}
        .btn-wpp:disabled{background:#a8e6c3;cursor:not-allowed;}
        .btn-outline{border:2px solid #c5dff0;border-radius:12px;padding:11px 18px;font-size:14px;font-weight:700;color:#4a90c4;background:#fff;transition:all .15s;}
        .btn-back{color:#7a9ab5;font-size:14px;font-weight:700;padding:4px 0;margin-bottom:8px;display:flex;align-items:center;gap:4px;}

        .input{width:100%;border:2px solid #daeaf7;border-radius:10px;padding:11px 14px;font-size:14px;outline:none;color:#1a3a5c;background:#fff;}
        .input:focus{border-color:#4a90c4;}
        textarea.input{resize:vertical;min-height:70px;}

        .overlay{position:fixed;inset:0;background:rgba(10,30,55,.45);z-index:100;display:flex;align-items:flex-end;justify-content:center;}
        .sheet{background:#f0f6fc;border-radius:22px 22px 0 0;width:100%;max-width:560px;padding:24px 20px;max-height:92vh;overflow-y:auto;}
        .sheet-title{font-family:'Playfair Display',serif;font-size:21px;color:#1a3a5c;margin-bottom:4px;}
        .sheet-sub{font-size:13px;color:#7a9ab5;margin-bottom:18px;}
        .section-card{background:#fff;border-radius:14px;border:1px solid #daeaf7;padding:14px;margin-bottom:12px;}
        .section-label{font-size:11px;font-weight:800;color:#7a9ab5;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;}

        .qty-btn{width:30px;height:30px;border-radius:50%;border:2px solid #daeaf7;font-size:17px;font-weight:800;color:#4a90c4;display:flex;align-items:center;justify-content:center;transition:all .15s;}
        .qty-btn:hover{background:#4a90c4;color:#fff;border-color:#4a90c4;}

        .radio-option{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:2px solid #daeaf7;background:#fff;cursor:pointer;transition:all .15s;margin-bottom:8px;}
        .radio-option.selected{border-color:#4a90c4;background:#f0f6fc;}
        .radio-dot{width:18px;height:18px;border-radius:50%;border:2px solid #c5dff0;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s;}
        .radio-option.selected .radio-dot{border-color:#4a90c4;background:#4a90c4;}
        .radio-dot-inner{width:7px;height:7px;border-radius:50%;background:#fff;}

        .step-indicator{display:flex;align-items:center;gap:6px;margin-bottom:20px;}
        .step-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;transition:all .2s;flex-shrink:0;}
        .step-dot.done{background:#4a90c4;color:#fff;}
        .step-dot.active{background:#1a3a5c;color:#fff;}
        .step-dot.todo{background:#e0eef8;color:#7a9ab5;}
        .step-line{flex:1;height:2px;border-radius:2px;}

        .sugestoes{position:absolute;width:100%;background:#fff;border:1.5px solid #daeaf7;border-radius:10px;overflow:hidden;z-index:200;box-shadow:0 4px 16px rgba(0,0,0,.12);}
        .sugestao-item{padding:10px 14px;font-size:13px;color:#1a3a5c;cursor:pointer;border-bottom:1px solid #f0f6fc;transition:background .12s;}
        .sugestao-item:last-child{border-bottom:none;}
        .sugestao-item:hover{background:#f0f6fc;}

        .status-badge{display:inline-block;padding:3px 12px;border-radius:100px;font-size:12px;font-weight:800;}
        .next-btn{background:#4a90c4;color:#fff;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:700;transition:background .15s;}
        .next-btn:hover{background:#1a3a5c;}
        .next-btn:disabled{background:#b0cfe4;cursor:not-allowed;}
        .del-btn{color:#c5dff0;font-size:20px;padding:2px 8px;transition:color .15s;}
        .del-btn:hover{color:#e63946;}
        .order-card{background:#fff;border-radius:14px;border:1px solid #daeaf7;padding:16px;margin-bottom:12px;}

        .cart-float{position:fixed;bottom:20px;left:0;right:0;display:flex;justify-content:center;z-index:90;}
        .cart-pill{background:#1a3a5c;color:#fff;border-radius:100px;padding:14px 28px;font-size:15px;font-weight:800;box-shadow:0 6px 24px rgba(26,58,92,.35);display:flex;gap:12px;align-items:center;}
        .cart-pill:hover{background:#4a90c4;}
        .cart-badge{background:#f5c518;color:#1a3a5c;border-radius:100px;padding:2px 10px;font-size:13px;font-weight:800;}

        .toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1a3a5c;color:#fff;padding:10px 22px;border-radius:100px;font-size:14px;font-weight:700;z-index:999;white-space:nowrap;animation:fadeUp .22s ease;}
        @keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
        .badge-dot{position:absolute;top:2px;right:4px;background:#f5c518;color:#1a3a5c;border-radius:100px;width:16px;height:16px;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;}
        .divider{border:none;border-top:1px solid #daeaf7;margin:10px 0;}
        .total-row{display:flex;justify-content:space-between;font-weight:800;font-size:16px;}
        .sub-row{display:flex;justify-content:space-between;font-size:13px;color:#7a9ab5;margin-bottom:4px;}
        .spinner{display:inline-block;width:14px;height:14px;border:2px solid #c5dff0;border-top-color:#4a90c4;border-radius:50%;animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .tabela-frete{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;}
        .tabela-frete th{background:#e8f2fb;color:#1a3a5c;font-weight:800;padding:6px 10px;text-align:left;}
        .tabela-frete td{padding:5px 10px;border-top:1px solid #f0f6fc;color:#444;}
        .field-label{font-size:12px;font-weight:700;color:#7a9ab5;display:block;margin-bottom:4px;}
        .obrigatorio{color:#e63946;margin-left:2px;}
        .frete-ok{background:#d1fae5;border:1.5px solid #6ee7b7;border-radius:12px;padding:12px 14px;margin-top:10px;}
        .frete-err{background:#fee2e2;border:1.5px solid #fca5a5;border-radius:12px;padding:12px 14px;margin-top:10px;}

        /* Home screen */
        .home-card{background:#fff;border-radius:20px;border:1px solid #daeaf7;padding:24px;margin-bottom:16px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:18px;}
        .home-card:hover{box-shadow:0 8px 24px rgba(74,144,196,.18);transform:translateY(-2px);}
        .home-icon{width:60px;height:60px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;}
        .home-card-title{font-weight:800;font-size:17px;color:#1a3a5c;margin-bottom:4px;}
        .home-card-sub{font-size:13px;color:#7a9ab5;line-height:1.4;}

        /* Evento */
        .ev-calc{background:#e8f2fb;border-radius:14px;padding:16px;margin:12px 0;}
        .ev-row{display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;}
        .ev-total{display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1a3a5c;border-top:2px solid #c5dff0;padding-top:8px;margin-top:4px;}
        .ev-warn{font-size:12px;color:#e63946;font-weight:700;margin-top:6px;}

        /* Local */
        .pix-box{background:#d1fae5;border:1.5px solid #6ee7b7;border-radius:12px;padding:14px;text-align:center;margin-top:8px;}
      `}</style>

      {/* HEADER */}
      <div className="header">
        <div className="header-inner">
          <div style={{cursor:"pointer"}} onClick={() => setAppMode("home")}>
            <div className="logo-text">☀ LA CELESTE</div>
            <div className="logo-sub">Pizzaria Uruguaia · Pelotas</div>
          </div>
          <div style={{display:"flex",gap:4}}>
            {(appMode === "delivery" || appMode === "local") && (
              <button className={"tab-btn"+(appMode==="delivery"?" active":"")} onClick={() => setAppMode("delivery")}>Delivery</button>
            )}
            <button className={"tab-btn"+(appMode==="painel"?" active":"")} onClick={() => setAppMode("painel")} style={{position:"relative"}}>
              Painel{active.length>0&&<span className="badge-dot">{active.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* ── HOME ── */}
      {appMode === "home" && (
        <div style={{maxWidth:560,margin:"0 auto",padding:"32px 20px 40px"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:48,marginBottom:8}}>☀</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#1a3a5c",fontWeight:700}}>Bem-vindo!</div>
            <div style={{fontSize:14,color:"#7a9ab5",marginTop:6}}>Como podemos te atender hoje?</div>
          </div>

          <div className="home-card" onClick={() => { setAppMode("delivery"); setCategoria("pizzas"); }}>
            <div className="home-icon" style={{background:"#e8f2fb"}}>🛵</div>
            <div>
              <div className="home-card-title">Delivery ou Retirada</div>
              <div className="home-card-sub">Peça pelo cardápio e receba em casa ou retire na pizzaria</div>
            </div>
            <div style={{color:"#c5dff0",fontSize:20,marginLeft:"auto"}}>›</div>
          </div>

          <div className="home-card" onClick={() => { setAppMode("local"); setCategoria("pizzas"); }}>
            <div className="home-icon" style={{background:"#fff8e1"}}>🪑</div>
            <div>
              <div className="home-card-title">Consumo Local</div>
              <div className="home-card-sub">Está no restaurante? Monte seu pedido e informe a mesa</div>
            </div>
            <div style={{color:"#c5dff0",fontSize:20,marginLeft:"auto"}}>›</div>
          </div>

          <div className="home-card" onClick={() => setAppMode("eventos")}>
            <div className="home-icon" style={{background:"#fdf2f8"}}>🎉</div>
            <div>
              <div className="home-card-title">Eventos</div>
              <div className="home-card-sub">Leve a La Celeste para o seu evento! Rodízio com forno próprio</div>
            </div>
            <div style={{color:"#c5dff0",fontSize:20,marginLeft:"auto"}}>›</div>
          </div>
        </div>
      )}

      {/* ── DELIVERY ── */}
      {appMode === "delivery" && (
        <div style={{maxWidth:640,margin:"0 auto",paddingBottom:100}}>
          <div className="cat-scroll">
            {CATEGORIAS_CARDAPIO.map(c=>(
              <button key={c.key} className={"cat-btn"+(categoria===c.key?" active":"")} onClick={()=>setCategoria(c.key)}>{c.label}</button>
            ))}
          </div>
          <div style={{padding:"14px 16px 0"}}>
            {categoria==="congeladas"&&(
              <div style={{background:"#e8f2fb",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#1a3a5c",fontWeight:600}}>
                🧊 Pizzas individuais congeladas — leve para casa e asse quando quiser!
              </div>
            )}
            {renderMenuSection(MENU[categoria])}
          </div>
        </div>
      )}

      {/* ── CONSUMO LOCAL ── */}
      {appMode === "local" && (
        <div style={{maxWidth:640,margin:"0 auto",paddingBottom:100}}>
          <div style={{background:"#fff8e1",borderLeft:"4px solid #f5c518",padding:"12px 16px",margin:"12px 16px",borderRadius:"0 10px 10px 0",fontSize:13,color:"#92400e",fontWeight:600}}>
            🪑 Pedido para consumo no restaurante — pagamento por PIX ou no caixa
          </div>
          <div className="cat-scroll">
            {CATEGORIAS_CARDAPIO.map(c=>(
              <button key={c.key} className={"cat-btn"+(categoria===c.key?" active":"")} onClick={()=>setCategoria(c.key)}>{c.label}</button>
            ))}
          </div>
          <div style={{padding:"14px 16px 0"}}>
            {renderMenuSection(MENU[categoria])}
          </div>
        </div>
      )}

      {/* ── EVENTOS ── */}
      {appMode === "eventos" && (
        <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 60px"}}>
          <button className="btn-back" onClick={()=>setAppMode("home")}>← Voltar</button>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#1a3a5c",marginBottom:4}}>🎉 La Celeste no seu Evento</div>
          <div style={{fontSize:13,color:"#7a9ab5",marginBottom:20}}>Preencha o formulário e entraremos em contato</div>

          {/* Como funciona */}
          <div className="section-card" style={{marginBottom:16}}>
            <div className="section-label">Como funciona</div>
            {["Levamos forno e toda infraestrutura até o local","Pizzas pré-montadas e assadas na hora, sempre quentinhas","Serviço de 4 horas com 1 pizzaiolo e 1 garçom","Rodízio com pizzas salgadas e doces","Pizzas servidas em tábuas de madeira · Guardanapos inclusos"].map((item,i)=>(
              <div key={i} style={{display:"flex",gap:8,fontSize:13,color:"#444",marginBottom:8}}>
                <span style={{color:"#4a90c4",fontWeight:800,flexShrink:0}}>✓</span>{item}
              </div>
            ))}
          </div>

          {/* Formulário */}
          <div className="section-card">
            <div className="section-label">Seus dados</div>
            <div style={{marginBottom:10}}>
              <label className="field-label">Nome<span className="obrigatorio">*</span></label>
              <input className="input" placeholder="Seu nome completo" value={evNome} onChange={e=>setEvNome(e.target.value)}/>
            </div>
            <div style={{marginBottom:10}}>
              <label className="field-label">WhatsApp<span className="obrigatorio">*</span></label>
              <input className="input" placeholder="(53) 99999-9999" value={evTel} onChange={e=>setEvTel(e.target.value)} inputMode="tel"/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}>
                <label className="field-label">Data do evento<span className="obrigatorio">*</span></label>
                <input className="input" type="date" value={evData} onChange={e=>setEvData(e.target.value)}/>
              </div>
            </div>
          </div>

          <div className="section-card" style={{marginTop:12}}>
            <div className="section-label">Local do evento</div>
            <label className="field-label">Endereço ou nome do espaço<span className="obrigatorio">*</span></label>
            <input className="input" placeholder="Endereço ou nome do espaço" value={evLocal} onChange={e=>setEvLocal(e.target.value)}/>
          </div>

          <div className="section-card" style={{marginTop:12}}>
            <div className="section-label">Participantes</div>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div style={{flex:1}}>
                <label className="field-label">Adultos (13+)<span className="obrigatorio">*</span></label>
                <input className="input" type="number" placeholder="0" min="0" value={evAdultos} onChange={e=>setEvAdultos(e.target.value)} inputMode="numeric"/>
                <div style={{fontSize:11,color:"#7a9ab5",marginTop:3}}>R$ 50 por pessoa</div>
              </div>
              <div style={{flex:1}}>
                <label className="field-label">Crianças (6–12)</label>
                <input className="input" type="number" placeholder="0" min="0" value={evMeias} onChange={e=>setEvMeias(e.target.value)} inputMode="numeric"/>
                <div style={{fontSize:11,color:"#7a9ab5",marginTop:3}}>R$ 25 por criança</div>
              </div>
              <div style={{flex:1}}>
                <label className="field-label">Até 5 anos</label>
                <input className="input" type="number" placeholder="0" min="0" value={evCortesia} onChange={e=>setEvCortesia(e.target.value)} inputMode="numeric"/>
                <div style={{fontSize:11,color:"#4a90c4",marginTop:3,fontWeight:700}}>Cortesia ✓</div>
              </div>
            </div>

            {/* Calculadora */}
            {(evAdultosN > 0 || evMeiasN > 0) && (
              <div className="ev-calc">
                <div style={{fontSize:12,fontWeight:800,color:"#1a3a5c",marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Estimativa de valor</div>
                {evAdultosN>0&&<div className="ev-row"><span>{evAdultosN} adulto{evAdultosN>1?"s":""} × R$ 50</span><span style={{fontWeight:700}}>{fmt(evAdultosN*50)}</span></div>}
                {evMeiasN>0&&<div className="ev-row"><span>{evMeiasN} criança{evMeiasN>1?"s":""} × R$ 25</span><span style={{fontWeight:700}}>{fmt(evMeiasN*25)}</span></div>}
                {evCortesiaN>0&&<div className="ev-row"><span>{evCortesiaN} criança{evCortesiaN>1?"s":""} (cortesia)</span><span style={{fontWeight:700,color:"#4a90c4"}}>Grátis</span></div>}
                <div className="ev-row"><span>Taxa de serviço/transporte (Pelotas)</span><span style={{fontWeight:700}}>R$ 200,00</span></div>
                <div className="ev-total"><span>Total estimado</span><span style={{color:"#4a90c4"}}>{fmt(evTotal)}</span></div>
                {evAdultosN < 25 && <div className="ev-warn">⚠️ Mínimo de 25 adultos para realizar o evento</div>}
                {evAdultosN >= 25 && <div style={{fontSize:12,color:"#065f46",fontWeight:700,marginTop:6}}>✓ {evTotalPessoas} pessoa{evTotalPessoas>1?"s":""} no total</div>}
              </div>
            )}
          </div>

          <div className="section-card" style={{marginTop:12}}>
            <div className="section-label">Observações</div>
            <textarea className="input" placeholder="Alguma informação adicional sobre o evento?" value={evObs} onChange={e=>setEvObs(e.target.value)}/>
          </div>

          <button className="btn-wpp" style={{marginTop:16}} disabled={!canEvento} onClick={enviarEvento}>
            📲 Enviar solicitação via WhatsApp
          </button>
          {!canEvento && evAdultosN > 0 && evAdultosN < 25 && (
            <div style={{fontSize:12,color:"#e63946",textAlign:"center",marginTop:8}}>Mínimo de 25 adultos para realizar o evento</div>
          )}
          {!canEvento && (!evNome||!evTel||!evData) && (
            <div style={{fontSize:12,color:"#7a9ab5",textAlign:"center",marginTop:8}}>Preencha todos os campos obrigatórios</div>
          )}
        </div>
      )}

      {/* ── PAINEL ── */}
      {appMode === "painel" && (
        <div style={{maxWidth:640,margin:"0 auto",padding:"16px 16px 40px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:16}}>Pedidos ativos <span style={{color:"#7a9ab5",fontWeight:600,fontSize:14}}>({active.length})</span></div>
          </div>
          {active.length===0&&(
            <div style={{textAlign:"center",padding:"60px 0",color:"#b0cfe4"}}>
              <div style={{fontSize:42,marginBottom:10}}>☀</div>
              <div style={{fontSize:15,fontWeight:600}}>Nenhum pedido ativo</div>
            </div>
          )}
          {active.map(order=>{
            const sc=STATUS_CONFIG[order.status];
            return(
              <div key={order.id} className="order-card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontWeight:800,fontSize:15}}>#{order.id}</span>
                    <span style={{fontSize:12,color:"#7a9ab5"}}>{order.hora}</span>
                    <span style={{fontSize:12,background:order.tipoEntrega==="local"?"#fff8e1":order.tipoEntrega==="retirada"?"#f0f6fc":"#fff8e1",color:order.tipoEntrega==="local"?"#92400e":order.tipoEntrega==="retirada"?"#4a90c4":"#b45309",borderRadius:6,padding:"2px 8px",fontWeight:700}}>
                      {order.tipoEntrega==="local"?"🪑 "+order.mesa:order.tipoEntrega==="retirada"?"🏠 Retirada":"🚗 "+order.mesa}
                    </span>
                  </div>
                  <button className="del-btn" onClick={()=>setOrders(p=>p.filter(o=>o.id!==order.id))}>×</button>
                </div>
                <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{order.cliente}</div>
                <div style={{fontSize:13,color:"#7a9ab5",marginBottom:6}}>
                  {order.itens.map((c,i)=><span key={i}>{c.qty>1?c.qty+"× ":""}{c.item.nome}{i<order.itens.length-1?", ":""}</span>)}
                </div>
                {order.obs&&<div style={{fontSize:12,color:"#e67e22",fontWeight:600,marginBottom:8}}>📝 {order.obs}</div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span className="status-badge" style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:14,fontWeight:800}}>{fmt(order.total)}</span>
                    <button className="next-btn" disabled={order.status==="entregue"} onClick={()=>advance(order.id)}>
                      {order.status==="recebido"?"Iniciar ▶":order.status==="preparo"?"Pronto ✓":order.status==="pronto"?"Entregar":"Entregue"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {done.length>0&&(
            <>
              <div style={{fontWeight:700,fontSize:14,color:"#b0cfe4",margin:"20px 0 10px"}}>Entregues ({done.length})</div>
              {done.map(order=>(
                <div key={order.id} style={{background:"#f7fafc",borderRadius:12,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,color:"#aaa"}}>#{order.id} · {order.hora} · {order.cliente}</span>
                  <button className="del-btn" style={{fontSize:17}} onClick={()=>setOrders(p=>p.filter(o=>o.id!==order.id))}>×</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* CART FLOAT */}
      {(appMode==="delivery"||appMode==="local") && cartCount>0 && (
        <div className="cart-float">
          <button className="cart-pill" onClick={()=>{ if(appMode==="delivery"){setStep(1);setShowCart(true);}else setShowLocalCart(true); }}>
            <span className="cart-badge">{cartCount}</span>
            Ver pedido · {fmt(subtotal)}
          </button>
        </div>
      )}

      {/* ── CHECKOUT DELIVERY ── */}
      {showCart&&(
        <div className="overlay" onClick={()=>setShowCart(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="step-indicator">
              {["Dados","Entrega","Pagamento"].map((s,i)=>(
                <div key={s} style={{display:"contents"}}>
                  <div className={"step-dot "+(step>i+1?"done":step===i+1?"active":"todo")}>{step>i+1?"✓":i+1}</div>
                  {i<2&&<div className="step-line" style={{background:step>i+1?"#4a90c4":"#e0eef8"}}/>}
                </div>
              ))}
              <span style={{fontSize:13,fontWeight:700,color:"#7a9ab5",marginLeft:4}}>{["Dados","Entrega","Pagamento"][step-1]}</span>
            </div>

            {step===1&&<>
              <div className="sheet-title">Seu pedido</div>
              <div className="sheet-sub">Revise os itens e preencha seus dados</div>
              <div className="section-card">
                <div className="section-label">Itens</div>
                {cart.map(c=>(
                  <div key={c.uid} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10,marginBottom:10,borderBottom:"1px solid #f0f6fc"}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14}}>{c.item.nome}</div>
                      <div style={{fontSize:12,color:"#7a9ab5"}}>{fmt(c.item.preco)} cada</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button className="qty-btn" onClick={()=>updateQty(c.uid,-1)}>−</button>
                      <span style={{fontWeight:800,fontSize:15,minWidth:20,textAlign:"center"}}>{c.qty}</span>
                      <button className="qty-btn" onClick={()=>updateQty(c.uid,1)}>+</button>
                      <span style={{fontWeight:800,fontSize:14,color:"#4a90c4",minWidth:60,textAlign:"right"}}>{fmt(c.item.preco*c.qty)}</span>
                    </div>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15}}>
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
              </div>
              <div className="section-card">
                <div className="section-label">Seus dados</div>
                <div style={{marginBottom:10}}>
                  <label className="field-label">Nome completo<span className="obrigatorio">*</span></label>
                  <input className="input" placeholder="Seu nome" value={clienteNome} onChange={e=>setClienteNome(e.target.value)}/>
                </div>
                <div>
                  <label className="field-label">WhatsApp<span className="obrigatorio">*</span></label>
                  <input className="input" placeholder="(53) 99999-9999" value={clienteTel} onChange={e=>setClienteTel(e.target.value)} inputMode="tel"/>
                </div>
              </div>
              <textarea className="input" placeholder="Observações (opcional)" value={obs} onChange={e=>setObs(e.target.value)} style={{marginBottom:16}}/>
              <button className="btn-primary" disabled={!canDeliveryStep1} onClick={()=>setStep(2)}>Continuar →</button>
              {!canDeliveryStep1&&<div style={{fontSize:12,color:"#e63946",textAlign:"center",marginTop:8}}>Preencha nome e WhatsApp para continuar</div>}
            </>}

            {step===2&&<>
              <button className="btn-back" onClick={()=>setStep(1)}>← Voltar</button>
              <div className="sheet-title">Como vai receber?</div>
              <div className="sheet-sub">Entrega ou retirada no restaurante</div>
              <div className={"radio-option"+(tipoEntrega==="retirada"?" selected":"")} onClick={()=>{setTipoEntrega("retirada");setDistanciaInfo(null);setEndereco("");}}>
                <div className="radio-dot"><div className="radio-dot-inner"/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14}}>🏠 Retirada no restaurante</div>
                  <div style={{fontSize:12,color:"#7a9ab5"}}>Grátis · Av. JK, 4165 · Pronto em 15–20 min</div>
                </div>
              </div>
              <div className={"radio-option"+(tipoEntrega==="entrega"?" selected":"")} onClick={()=>setTipoEntrega("entrega")}>
                <div className="radio-dot"><div className="radio-dot-inner"/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14}}>🚗 Entrega em domicílio</div>
                  <div style={{fontSize:12,color:"#7a9ab5"}}>Taxa calculada pela distância · até 13 km</div>
                </div>
              </div>

              {tipoEntrega==="entrega"&&(
                <div className="section-card" style={{marginTop:12}}>
                  <div className="section-label">Endereço de entrega</div>
                  {distanciaInfo&&!calculando?(
                    <div style={{marginBottom:10}}>
                      {distanciaInfo.lat&&distanciaInfo.lng&&(
                        <div style={{borderRadius:12,overflow:"hidden",marginBottom:8,border:"1.5px solid #daeaf7"}}>
                          <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${distanciaInfo.lat},${distanciaInfo.lng}&zoom=16&size=600x200&scale=2&markers=color:red%7C${distanciaInfo.lat},${distanciaInfo.lng}&key=${GOOGLE_MAPS_API_KEY}`} alt="Mapa" style={{width:"100%",display:"block"}}/>
                        </div>
                      )}
                      {distanciaInfo.faixa.taxa!==null?(
                        <div className="frete-ok" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:"#065f46"}}>📍 {endereco}</div>
                            <div style={{fontSize:12,color:"#047857",marginTop:4}}>~{distanciaInfo.km} km · Taxa: <strong>{fmt(distanciaInfo.faixa.taxa)}</strong></div>
                          </div>
                          <button style={{fontSize:12,color:"#4a90c4",fontWeight:700,cursor:"pointer",marginLeft:12,flexShrink:0}} onClick={()=>{setEndereco("");setDistanciaInfo(null);setSugestoes([]);}}>Trocar</button>
                        </div>
                      ):(
                        <div className="frete-err">
                          <div style={{fontSize:13,fontWeight:700,color:"#b91c1c",marginBottom:6}}>📍 {endereco}</div>
                          <div style={{fontSize:12,color:"#dc2626",fontWeight:700,marginBottom:8}}>⚠️ Fora da área de entrega (acima de 13 km)</div>
                          <button style={{fontSize:12,color:"#4a90c4",fontWeight:700,cursor:"pointer"}} onClick={()=>{setEndereco("");setDistanciaInfo(null);setSugestoes([]);}}>← Buscar outro</button>
                        </div>
                      )}
                    </div>
                  ):(
                    <div style={{marginBottom:10,position:"relative"}}>
                      <label className="field-label">Buscar endereço<span className="obrigatorio">*</span></label>
                      <input className="input" placeholder="Digite sua rua e número..." value={endereco} onChange={e=>handleEnderecoInput(e.target.value)} autoComplete="off" disabled={calculando}/>
                      {calculando&&<div style={{position:"absolute",right:12,top:36}}><div className="spinner"/></div>}
                      {sugestoes.length>0&&(
                        <div className="sugestoes">
                          {sugestoes.map(s=>(
                            <div key={s.place_id} className="sugestao-item" onClick={()=>selecionarSugestao(s)}>
                              <div style={{fontWeight:600,fontSize:13}}>{s.structured_formatting?.main_text||s.description}</div>
                              <div style={{fontSize:11,color:"#aaa"}}>{s.structured_formatting?.secondary_text||""}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{marginBottom:10}}>
                    <label className="field-label">Complemento <span style={{fontWeight:400}}>(opcional)</span></label>
                    <input className="input" placeholder="Apto, casa, bloco..." value={complemento} onChange={e=>setComplemento(e.target.value)}/>
                  </div>
                  <details style={{marginTop:8}}>
                    <summary style={{fontSize:12,color:"#7a9ab5",cursor:"pointer",fontWeight:700}}>Ver tabela de frete</summary>
                    <table className="tabela-frete">
                      <thead><tr><th>Distância</th><th>Taxa</th></tr></thead>
                      <tbody>
                        {FAIXAS_FRETE.filter(f=>f.ate<999).map(f=>(
                          <tr key={f.ate}><td>{f.label}</td><td style={{fontWeight:700,color:"#4a90c4"}}>{fmt(f.taxa)}</td></tr>
                        ))}
                        <tr><td>Acima de 13 km</td><td style={{color:"#e63946",fontWeight:700}}>A combinar</td></tr>
                      </tbody>
                    </table>
                  </details>
                </div>
              )}

              {tipoEntrega&&(tipoEntrega==="retirada"||(tipoEntrega==="entrega"&&distanciaInfo))&&(
                <div className="section-card" style={{marginTop:12}}>
                  <div className="sub-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                  {tipoEntrega==="entrega"&&distanciaInfo?.faixa?.taxa!=null&&(
                    <div className="sub-row"><span>Taxa de entrega</span><span>{fmt(distanciaInfo.faixa.taxa)}</span></div>
                  )}
                  <hr className="divider"/>
                  <div className="total-row"><span>Total</span><span style={{color:"#4a90c4"}}>{fmt(tipoEntrega==="retirada"?subtotal:subtotal+(distanciaInfo?.faixa?.taxa||0))}</span></div>
                </div>
              )}
              <button className="btn-primary" style={{marginTop:16}} disabled={!canDeliveryStep2} onClick={()=>setStep(3)}>Continuar →</button>
            </>}

            {step===3&&<>
              <button className="btn-back" onClick={()=>setStep(2)}>← Voltar</button>
              <div className="sheet-title">Forma de pagamento</div>
              <div className="sheet-sub">Como vai pagar?</div>
              {[{key:"pix",label:"PIX",icon:"⚡",sub:"Pagamento na hora com QR code"},{key:"cartao",label:"Cartão",icon:"💳",sub:"Débito ou crédito na entrega/retirada"},{key:"dinheiro",label:"Dinheiro",icon:"💵",sub:"Informe se precisar de troco"}].map(p=>(
                <div key={p.key} className={"radio-option"+(pagamento===p.key?" selected":"")} onClick={()=>setPagamento(p.key)}>
                  <div className="radio-dot"><div className="radio-dot-inner"/></div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14}}>{p.icon} {p.label}</div>
                    <div style={{fontSize:12,color:"#7a9ab5"}}>{p.sub}</div>
                  </div>
                </div>
              ))}
              {pagamento==="dinheiro"&&<input className="input" placeholder="Troco para quanto? (ex: 100)" value={troco} onChange={e=>setTroco(e.target.value)} style={{marginTop:10}} inputMode="numeric"/>}
              <div className="section-card" style={{marginTop:16}}>
                <div className="sub-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {tipoEntrega==="entrega"&&distanciaInfo?.faixa?.taxa!=null&&<div className="sub-row"><span>Taxa de entrega</span><span>{fmt(distanciaInfo.faixa.taxa)}</span></div>}
                <hr className="divider"/>
                <div className="total-row"><span>Total</span><span style={{color:"#4a90c4"}}>{fmt(total)}</span></div>
              </div>
              <button className="btn-wpp" style={{marginTop:16}} disabled={!canDeliveryStep3} onClick={confirmDelivery}>📲 Enviar pedido via WhatsApp</button>
              <div style={{fontSize:12,color:"#7a9ab5",textAlign:"center",marginTop:8}}>Você será redirecionado para o WhatsApp com o pedido formatado</div>
            </>}
          </div>
        </div>
      )}

      {/* ── CHECKOUT LOCAL ── */}
      {showLocalCart&&(
        <div className="overlay" onClick={()=>setShowLocalCart(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-title">🪑 Pedido — Mesa</div>
            <div className="sheet-sub">Confirme o pedido e informe sua mesa</div>
            <div className="section-card">
              <div className="section-label">Itens</div>
              {cart.map(c=>(
                <div key={c.uid} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10,marginBottom:10,borderBottom:"1px solid #f0f6fc"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14}}>{c.item.nome}</div>
                    <div style={{fontSize:12,color:"#7a9ab5"}}>{fmt(c.item.preco)} cada</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <button className="qty-btn" onClick={()=>updateQty(c.uid,-1)}>−</button>
                    <span style={{fontWeight:800,fontSize:15,minWidth:20,textAlign:"center"}}>{c.qty}</span>
                    <button className="qty-btn" onClick={()=>updateQty(c.uid,1)}>+</button>
                    <span style={{fontWeight:800,fontSize:14,color:"#4a90c4",minWidth:60,textAlign:"right"}}>{fmt(c.item.preco*c.qty)}</span>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15}}>
                <span>Total</span><span style={{color:"#4a90c4"}}>{fmt(subtotal)}</span>
              </div>
            </div>

            <div className="section-card" style={{marginTop:12}}>
              <div className="section-label">Seus dados</div>
              <div style={{marginBottom:10}}>
                <label className="field-label">Seu nome<span className="obrigatorio">*</span></label>
                <input className="input" placeholder="Nome" value={localNome} onChange={e=>setLocalNome(e.target.value)}/>
              </div>
              <div>
                <label className="field-label">Mesa / Localização<span className="obrigatorio">*</span></label>
                <input className="input" placeholder="Ex: Mesa 5, Área externa..." value={localMesa} onChange={e=>setLocalMesa(e.target.value)}/>
              </div>
            </div>

            <div className="section-card" style={{marginTop:12}}>
              <div className="section-label">Forma de pagamento</div>
              <div className={"radio-option"+(localPag==="pix"?" selected":"")} onClick={()=>setLocalPag("pix")}>
                <div className="radio-dot"><div className="radio-dot-inner"/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14}}>⚡ PIX</div>
                  <div style={{fontSize:12,color:"#7a9ab5"}}>Pague agora pelo QR code</div>
                </div>
              </div>
              <div className={"radio-option"+(localPag==="caixa"?" selected":"")} onClick={()=>setLocalPag("caixa")}>
                <div className="radio-dot"><div className="radio-dot-inner"/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14}}>🏧 Pagar no caixa</div>
                  <div style={{fontSize:12,color:"#7a9ab5"}}>Débito, crédito ou dinheiro no caixa</div>
                </div>
              </div>
            </div>

            <button className="btn-wpp" style={{marginTop:16}} disabled={!canLocal} onClick={confirmLocal}>📲 Enviar pedido</button>
          </div>
        </div>
      )}

      {toast&&<div className="toast">{toast}</div>}
    </div>
  );
}
