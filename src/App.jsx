import { useState, useRef, useEffect, useCallback } from "react";

const WHATSAPP_NUMBER = "5553991321557";
const GOOGLE_MAPS_API_KEY = "AIzaSyAmNw6R38YWVm9qT9QcdeDvpMdMEs-pnzY";
const PIZZARIA_LAT = -31.7654;
const PIZZARIA_LNG = -52.3376;

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
  classicas: [
    { id: 1,  nome: "Marguerita",                desc: "Molho de tomate, mussarela, tomate cereja, pesto e manjericão", preco: 28 },
    { id: 2,  nome: "Calabresa",                 desc: "Molho de tomate, mussarela, calabresa, catupiry e orégano", preco: 28 },
    { id: 3,  nome: "Pepperoni",                 desc: "Molho de tomate, mussarela, pepperoni, catupiry e orégano", preco: 32 },
    { id: 4,  nome: "5 Queijos",                 desc: "Molho de tomate, mussarela, provolone, gorgonzola, prato, cheddar e orégano", preco: 35 },
  ],
  especiais: [
    { id: 5,  nome: "Alcatra c/ gorgonzola",     desc: "Molho de tomate, mussarela, alcatra, gorgonzola e orégano", preco: 35 },
    { id: 6,  nome: "4 Queijos c/ alcatra",      desc: "Molho de tomate, mussarela, alcatra, prato, provolone, cheddar e orégano", preco: 35 },
    { id: 7,  nome: "Vazio c/ cebola caramelizada", desc: "Molho de tomate, mussarela, vazio e cebola caramelizada", preco: 35 },
    { id: 8,  nome: "Entrecot c/ chimichurri",   desc: "Molho de tomate, mussarela, entrecot, catupiry e chimichurri", preco: 35 },
    { id: 9,  nome: "Mussarela c/ pesto uruguaio", desc: "Molho de tomate, mussarela e pesto uruguaio", preco: 34 },
    { id: 10, nome: "Presunto parma c/ geleia de figo", desc: "Molho de tomate, mussarela, presunto parma e geleia de figo", preco: 48 },
  ],
  doces: [
    { id: 11, nome: "Doce de leite Conaprole",   desc: "Doce de leite Conaprole e mussarela", preco: 36 },
    { id: 12, nome: "Chocolate c/ castanha de caju", desc: "Chocolate ao leite ou branco, mussarela e castanha de caju", preco: 36 },
    { id: 13, nome: "Chocolate c/ MM's",          desc: "Chocolate ao leite ou branco e confeito MM's", preco: 36 },
  ],
  congeladas: [
    { id: 14, nome: "Marguerita",                desc: "Pizza congelada individual", preco: 28 },
    { id: 15, nome: "Calabresa",                 desc: "Pizza congelada individual", preco: 28 },
    { id: 16, nome: "Pepperoni",                 desc: "Pizza congelada individual", preco: 32 },
    { id: 17, nome: "5 Queijos",                 desc: "Pizza congelada individual", preco: 35 },
    { id: 18, nome: "Alcatra c/ gorgonzola",     desc: "Pizza congelada individual — Especial La Celeste", preco: 35 },
    { id: 19, nome: "4 Queijos c/ alcatra",      desc: "Pizza congelada individual — Especial La Celeste", preco: 35 },
    { id: 20, nome: "Vazio c/ cebola caramelizada", desc: "Pizza congelada individual — Especial La Celeste", preco: 35 },
    { id: 21, nome: "Entrecot c/ chimichurri",   desc: "Pizza congelada individual — Especial La Celeste", preco: 35 },
    { id: 22, nome: "Chocolate branco c/ castanha de caju", desc: "Pizza doce congelada individual", preco: 30 },
    { id: 23, nome: "Doce de leite Conaprole",   desc: "Pizza doce congelada individual", preco: 30 },
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
    { id: 50, nome: "Água mineral com gás",  desc: "500ml", preco: 4 },
    { id: 51, nome: "Água mineral sem gás",  desc: "500ml", preco: 4 },
    { id: 52, nome: "Coca-Cola",             desc: "Lata 350ml", preco: 7 },
    { id: 53, nome: "Coca-Cola Zero",        desc: "Lata 350ml", preco: 7 },
    { id: 54, nome: "Guaraná Fruki",         desc: "Lata 350ml", preco: 7 },
    { id: 55, nome: "Guaraná Fruki Zero",    desc: "Lata 350ml", preco: 7 },
    { id: 56, nome: "Sprite",               desc: "Lata 350ml", preco: 7 },
    { id: 57, nome: "Sprite Zero",          desc: "Lata 350ml", preco: 7 },
  ],
};

const CATEGORIAS = [
  { key: "classicas",  label: "🍕 Clássicas" },
  { key: "especiais",  label: "⭐ Especiais" },
  { key: "doces",      label: "🍫 Doces" },
  { key: "congeladas", label: "🧊 Congeladas" },
  { key: "aguas",      label: "🥤 Bebidas" },
  { key: "cervejas",   label: "🍺 Cervejas" },
  { key: "vinhos",     label: "🍷 Vinhos" },
];

const STATUS_CONFIG = {
  recebido: { label: "Recebido",    color: "#b45309", bg: "#fef3c7" },
  preparo:  { label: "Em preparo",  color: "#1d4ed8", bg: "#dbeafe" },
  pronto:   { label: "Pronto! ✓",  color: "#065f46", bg: "#d1fae5" },
  entregue: { label: "Entregue",    color: "#6b7280", bg: "#f3f4f6" },
};

let nextId = 1;

// Load Google Maps script once
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) { resolve(); return; }
    const existing = document.querySelector('script[data-gmap]');
    if (existing) { existing.addEventListener('load', resolve); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.setAttribute('data-gmap', '1');
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function LaCelesteApp() {
  const [view, setView]           = useState("cardapio");
  const [categoria, setCategoria] = useState("classicas");
  const [cart, setCart]           = useState([]);
  const [orders, setOrders]       = useState([]);
  const [showCart, setShowCart]   = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [toast, setToast]         = useState(null);

  // Checkout
  const [step, setStep]           = useState(1);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTel, setClienteTel]   = useState("");
  const [tipoEntrega, setTipoEntrega] = useState(null);
  const [endereco, setEndereco]       = useState("");
  const [endNumero, setEndNumero]     = useState("");
  const [complemento, setComplemento] = useState("");
  const [sugestoes, setSugestoes]     = useState([]);
  const [distanciaInfo, setDistanciaInfo] = useState(null);
  const [calculando, setCalculando]   = useState(false);
  const [erroEnd, setErroEnd]         = useState("");
  const [obs, setObs]                 = useState("");
  const [pagamento, setPagamento]     = useState(null);
  const [troco, setTroco]             = useState("");
  const [manualForm, setManualForm]   = useState({ nome: "", mesa: "", itens: "", obs: "" });

  const autocompleteService = useRef(null);
  const debounceRef = useRef(null);
  const sessionToken = useRef(null);

  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then(() => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
      }
    }).catch(() => {});
  }, []);

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

  // Autocomplete de endereço
  function handleEnderecoInput(val) {
    setEndereco(val);
    setDistanciaInfo(null);
    setErroEnd("");
    clearTimeout(debounceRef.current);
    if (!val || val.length < 4) { setSugestoes([]); return; }
    debounceRef.current = setTimeout(() => {
      if (!autocompleteService.current) return;
      autocompleteService.current.getPlacePredictions({
        input: val + ", Pelotas, RS",
        componentRestrictions: { country: "br" },
        sessionToken: sessionToken.current,
      }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSugestoes(predictions.slice(0, 5));
        } else {
          setSugestoes([]);
        }
      });
    }, 400);
  }

  async function selecionarSugestao(sugestao) {
    setSugestoes([]);
    const descricao = sugestao.structured_formatting?.main_text || sugestao.description;
    setEndereco(descricao);
    setCalculando(true);
    setErroEnd("");
    try {
      const query = encodeURIComponent(sugestao.description);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const km = haversineKm(PIZZARIA_LAT, PIZZARIA_LNG, lat, lng);
        const faixa = calcularFrete(km);
        setDistanciaInfo({ km: km.toFixed(1), faixa });
        if (faixa.taxa === null) setErroEnd("Fora da área de entrega (acima de 13 km). Entre em contato pelo WhatsApp.");
      } else {
        setErroEnd("Não foi possível calcular a distância. Tente novamente.");
      }
    } catch(e) {
      setErroEnd("Erro ao calcular distância.");
    }
    setCalculando(false);
    sessionToken.current = window.google?.maps?.places ? new window.google.maps.places.AutocompleteSessionToken() : null;
  }

  function validarEndNumero(val) {
    if (val && !/\d/.test(val)) return false;
    return true;
  }

  function buildWhatsAppMsg() {
    const isRetirada = tipoEntrega === "retirada";
    let msg = "☀ *Pedido La Celeste*\n\n";
    msg += "👤 *Cliente:* " + clienteNome + "\n";
    msg += "📱 *WhatsApp:* " + clienteTel + "\n";
    msg += "\n🍕 *Itens:*\n";
    cart.forEach(c => { msg += "• " + (c.qty > 1 ? c.qty + "× " : "") + c.item.nome + " — " + fmt(c.item.preco * c.qty) + "\n"; });
    msg += "\n💰 *Subtotal:* " + fmt(subtotal) + "\n";
    if (isRetirada) {
      msg += "🏠 *Retirada no restaurante*\n";
      msg += "📍 Av. Juscelino Kubitschek, 4165 — Pelotas\n";
    } else {
      msg += "🚗 *Entrega*\n";
      msg += "📍 *Endereço:* " + endereco + ", " + endNumero;
      if (complemento) msg += " — " + complemento;
      msg += "\n";
      if (distanciaInfo) {
        msg += "📏 *Distância:* ~" + distanciaInfo.km + " km (" + distanciaInfo.faixa.label + ")\n";
        msg += "🚚 *Taxa de entrega:* " + (distanciaInfo.faixa.taxa != null ? fmt(distanciaInfo.faixa.taxa) : "A combinar") + "\n";
      }
    }
    msg += "💳 *Pagamento:* " + (pagamento === "dinheiro" ? "Dinheiro" + (troco ? " (troco p/ R$ " + troco + ")" : "") : pagamento === "pix" ? "PIX" : "Cartão") + "\n";
    msg += "\n✅ *Total:* " + fmt(total) + "\n";
    if (obs) msg += "\n📝 *Obs:* " + obs + "\n";
    return encodeURIComponent(msg);
  }

  function confirmOrder() {
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + buildWhatsAppMsg(), "_blank");
    setOrders(prev => [{
      id: nextId++, cliente: clienteNome, tel: clienteTel,
      mesa: tipoEntrega === "retirada" ? "Retirada" : (distanciaInfo ? distanciaInfo.km + " km" : "Entrega"),
      itens: [...cart], obs, status: "recebido",
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      total, tipoEntrega,
    }, ...prev]);
    setCart([]); setClienteNome(""); setClienteTel(""); setTipoEntrega(null);
    setEndereco(""); setEndNumero(""); setComplemento(""); setDistanciaInfo(null);
    setObs(""); setPagamento(null); setTroco(""); setShowCart(false); setStep(1);
    showToast("Pedido enviado via WhatsApp! 🎉");
  }

  function submitManual() {
    if (!manualForm.itens) return;
    setOrders(prev => [{
      id: nextId++, cliente: manualForm.nome || "—", mesa: manualForm.mesa || "—",
      itens: [{ item: { id: -1, nome: manualForm.itens, preco: 0 }, qty: 1 }],
      obs: manualForm.obs, status: "recebido",
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      total: 0, manual: true,
    }, ...prev]);
    setManualForm({ nome: "", mesa: "", itens: "", obs: "" });
    setShowManual(false); showToast("Pedido lançado!");
  }

  function advance(id) {
    const steps = ["recebido","preparo","pronto","entregue"];
    setOrders(prev => prev.map(o => o.id !== id ? o : { ...o, status: steps[Math.min(steps.indexOf(o.status)+1,3)] }));
  }

  const active = orders.filter(o => o.status !== "entregue");
  const done   = orders.filter(o => o.status === "entregue");

  const enderecoComNumero = endereco.trim() && endNumero.trim() && /\d/.test(endNumero);
  const canStep1 = clienteNome.trim().length > 1 && clienteTel.replace(/\D/g,"").length >= 10;
  const canStep2 = tipoEntrega === "retirada" || (tipoEntrega === "entrega" && enderecoComNumero && distanciaInfo && distanciaInfo.faixa.taxa !== null);
  const canStep3 = !!pagamento;

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", minHeight:"100vh", background:"#f0f6fc", color:"#1a3a5c" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{cursor:pointer;border:none;background:none;font-family:inherit;}
        input,textarea,select{font-family:inherit;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#c5dff0;border-radius:4px;}

        .header{background:#1a3a5c;padding:0 16px;position:sticky;top:0;z-index:50;}
        .header-inner{max-width:640px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:58px;}
        .logo-text{font-family:'Playfair Display',serif;color:#f5c518;font-size:22px;letter-spacing:1px;}
        .logo-sub{font-size:10px;color:#7fb3d5;letter-spacing:2px;text-transform:uppercase;}

        .tab-btn{padding:7px 18px;border-radius:100px;font-size:13px;font-weight:700;color:#7fb3d5;transition:all .18s;position:relative;}
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
        .input.error{border-color:#e63946;}
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

        .frete-ok{background:#d1fae5;border:1.5px solid #6ee7b7;border-radius:12px;padding:12px 14px;margin-top:10px;}
        .frete-err{background:#fee2e2;border:1.5px solid #fca5a5;border-radius:12px;padding:12px 14px;margin-top:10px;}
        .frete-loading{background:#f0f6fc;border:1.5px solid #c5dff0;border-radius:12px;padding:12px 14px;margin-top:10px;display:flex;align-items:center;gap:8px;font-size:13px;color:#4a90c4;}

        .sugestoes{background:#fff;border:1.5px solid #daeaf7;border-radius:10px;overflow:hidden;margin-top:4px;}
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
        .field-error{font-size:11px;color:#e63946;margin-top:3px;font-weight:700;}
        .obrigatorio{color:#e63946;margin-left:2px;}
        .congelada-badge{display:inline-block;background:#e8f2fb;color:#4a90c4;border-radius:6px;font-size:10px;font-weight:800;padding:2px 6px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;}
      `}</style>

      {/* HEADER */}
      <div className="header">
        <div className="header-inner">
          <div>
            <div className="logo-text">☀ LA CELESTE</div>
            <div className="logo-sub">Pizzaria Uruguaia · Pelotas</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button className={"tab-btn"+(view==="cardapio"?" active":"")} onClick={()=>setView("cardapio")}>Cardápio</button>
            <button className={"tab-btn"+(view==="painel"?" active":"")} onClick={()=>setView("painel")} style={{position:"relative"}}>
              Painel{active.length>0&&<span className="badge-dot">{active.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* CARDÁPIO */}
      {view==="cardapio"&&(
        <div style={{maxWidth:640,margin:"0 auto",paddingBottom:100}}>
          <div className="cat-scroll">
            {CATEGORIAS.map(c=>(
              <button key={c.key} className={"cat-btn"+(categoria===c.key?" active":"")} onClick={()=>setCategoria(c.key)}>{c.label}</button>
            ))}
          </div>
          <div style={{padding:"14px 16px 0"}}>
            {categoria==="congeladas"&&(
              <div style={{background:"#e8f2fb",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#1a3a5c",fontWeight:600}}>
                🧊 Pizzas individuais congeladas — leve para casa e asse quando quiser!
              </div>
            )}
            {MENU[categoria].map(item=>(
              <div key={item.id} className="card">
                <div style={{flex:1}}>
                  {categoria==="congeladas"&&<div className="congelada-badge">Congelada</div>}
                  <div className="card-name">{item.nome}</div>
                  <div className="card-desc">{item.desc}</div>
                  <div className="card-price">{fmt(item.preco)}</div>
                </div>
                <button className="add-btn" onClick={()=>addToCart(item)}>+</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAINEL */}
      {view==="painel"&&(
        <div style={{maxWidth:640,margin:"0 auto",padding:"16px 16px 40px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:16}}>Pedidos ativos <span style={{color:"#7a9ab5",fontWeight:600,fontSize:14}}>({active.length})</span></div>
            <button className="btn-outline" style={{fontSize:13,padding:"7px 14px"}} onClick={()=>setShowManual(true)}>+ Manual</button>
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
                    <span style={{fontSize:12,background:order.tipoEntrega==="retirada"?"#f0f6fc":"#fff8e1",color:order.tipoEntrega==="retirada"?"#4a90c4":"#b45309",borderRadius:6,padding:"2px 8px",fontWeight:700}}>
                      {order.tipoEntrega==="retirada"?"🏠 Retirada":"🚗 "+order.mesa}
                    </span>
                  </div>
                  <button className="del-btn" onClick={()=>setOrders(p=>p.filter(o=>o.id!==order.id))}>×</button>
                </div>
                <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{order.cliente}</div>
                {order.tel&&<div style={{fontSize:12,color:"#7a9ab5",marginBottom:4}}>📱 {order.tel}</div>}
                <div style={{fontSize:13,color:"#7a9ab5",marginBottom:6}}>
                  {order.itens.map((c,i)=><span key={i}>{c.qty>1?c.qty+"× ":""}{c.item.nome}{i<order.itens.length-1?", ":""}</span>)}
                </div>
                {order.obs&&<div style={{fontSize:12,color:"#e67e22",fontWeight:600,marginBottom:8}}>📝 {order.obs}</div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span className="status-badge" style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    {!order.manual&&<span style={{fontSize:14,fontWeight:800}}>{fmt(order.total)}</span>}
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
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    {!order.manual&&<span style={{fontSize:13,color:"#b0cfe4"}}>{fmt(order.total)}</span>}
                    <button className="del-btn" style={{fontSize:17}} onClick={()=>setOrders(p=>p.filter(o=>o.id!==order.id))}>×</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* CART FLOAT */}
      {view==="cardapio"&&cartCount>0&&(
        <div className="cart-float">
          <button className="cart-pill" onClick={()=>{setStep(1);setShowCart(true);}}>
            <span className="cart-badge">{cartCount}</span>
            Ver pedido · {fmt(subtotal)}
          </button>
        </div>
      )}

      {/* CHECKOUT */}
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

            {/* STEP 1 */}
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
                  <label style={{fontSize:12,fontWeight:700,color:"#7a9ab5",display:"block",marginBottom:4}}>
                    Nome completo<span className="obrigatorio">*</span>
                  </label>
                  <input className="input" placeholder="Seu nome" value={clienteNome} onChange={e=>setClienteNome(e.target.value)} />
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:"#7a9ab5",display:"block",marginBottom:4}}>
                    WhatsApp<span className="obrigatorio">*</span>
                  </label>
                  <input className="input" placeholder="(53) 99999-9999" value={clienteTel} onChange={e=>setClienteTel(e.target.value)} inputMode="tel" />
                  {clienteTel&&clienteTel.replace(/\D/g,"").length<10&&<div className="field-error">Informe um número válido com DDD</div>}
                </div>
              </div>
              <textarea className="input" placeholder="Observações (opcional)" value={obs} onChange={e=>setObs(e.target.value)} style={{marginBottom:16}}/>
              <button className="btn-primary" disabled={!canStep1} onClick={()=>setStep(2)}>Continuar →</button>
              {!canStep1&&<div style={{fontSize:12,color:"#e63946",textAlign:"center",marginTop:8}}>Preencha nome e WhatsApp para continuar</div>}
            </>}

            {/* STEP 2 */}
            {step===2&&<>
              <button className="btn-back" onClick={()=>setStep(1)}>← Voltar</button>
              <div className="sheet-title">Como vai receber?</div>
              <div className="sheet-sub">Entrega ou retirada no restaurante</div>

              <div className={"radio-option"+(tipoEntrega==="retirada"?" selected":"")} onClick={()=>{setTipoEntrega("retirada");setDistanciaInfo(null);setEndereco("");setEndNumero("");setComplemento("");}}>
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

                  <div style={{marginBottom:10,position:"relative"}}>
                    <label style={{fontSize:12,fontWeight:700,color:"#7a9ab5",display:"block",marginBottom:4}}>
                      Rua / Avenida<span className="obrigatorio">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="Ex: Rua Andrade Neves"
                      value={endereco}
                      onChange={e=>handleEnderecoInput(e.target.value)}
                      autoComplete="off"
                    />
                    {sugestoes.length>0&&(
                      <div className="sugestoes">
                        {sugestoes.map(s=>(
                          <div key={s.place_id} className="sugestao-item" onClick={()=>selecionarSugestao(s)}>
                            📍 {s.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{display:"flex",gap:10,marginBottom:10}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:12,fontWeight:700,color:"#7a9ab5",display:"block",marginBottom:4}}>
                        Número<span className="obrigatorio">*</span>
                      </label>
                      <input
                        className={"input"+(endNumero&&!/\d/.test(endNumero)?" error":"")}
                        placeholder="Ex: 123"
                        value={endNumero}
                        onChange={e=>setEndNumero(e.target.value)}
                        inputMode="numeric"
                      />
                      {endNumero&&!/\d/.test(endNumero)&&<div className="field-error">Informe o número</div>}
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:12,fontWeight:700,color:"#7a9ab5",display:"block",marginBottom:4}}>Complemento</label>
                      <input className="input" placeholder="Apto, casa... (opcional)" value={complemento} onChange={e=>setComplemento(e.target.value)} />
                    </div>
                  </div>

                  {calculando&&<div className="frete-loading"><div className="spinner"/> Calculando distância...</div>}

                  {distanciaInfo&&!calculando&&distanciaInfo.faixa.taxa!==null&&(
                    <div className="frete-ok">
                      <div style={{fontWeight:800,fontSize:14,color:"#065f46",marginBottom:4}}>✓ Entrega disponível</div>
                      <div style={{fontSize:13,color:"#047857"}}>
                        📏 ~{distanciaInfo.km} km ({distanciaInfo.faixa.label})<br/>
                        🚚 Taxa: <strong>{fmt(distanciaInfo.faixa.taxa)}</strong>
                      </div>
                    </div>
                  )}

                  {(erroEnd&&!calculando)&&(
                    <div className="frete-err">
                      <div style={{fontWeight:800,fontSize:13,color:"#b91c1c"}}>⚠️ {erroEnd}</div>
                    </div>
                  )}

                  {!enderecoComNumero&&endereco&&!endNumero&&(
                    <div style={{fontSize:12,color:"#e63946",marginTop:6,fontWeight:700}}>Informe o número do endereço para continuar</div>
                  )}

                  <details style={{marginTop:14}}>
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

              {tipoEntrega&&(tipoEntrega==="retirada"||distanciaInfo)&&(
                <div className="section-card" style={{marginTop:12}}>
                  <div className="sub-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                  {tipoEntrega==="entrega"&&distanciaInfo?.faixa?.taxa!=null&&(
                    <div className="sub-row"><span>Taxa de entrega (~{distanciaInfo.km} km)</span><span>{fmt(distanciaInfo.faixa.taxa)}</span></div>
                  )}
                  <hr className="divider"/>
                  <div className="total-row"><span>Total</span><span style={{color:"#4a90c4"}}>{fmt(tipoEntrega==="retirada"?subtotal:subtotal+(distanciaInfo?.faixa?.taxa||0))}</span></div>
                </div>
              )}

              <button className="btn-primary" style={{marginTop:16}} disabled={!canStep2} onClick={()=>setStep(3)}>Continuar →</button>
            </>}

            {/* STEP 3 */}
            {step===3&&<>
              <button className="btn-back" onClick={()=>setStep(2)}>← Voltar</button>
              <div className="sheet-title">Forma de pagamento</div>
              <div className="sheet-sub">Como vai pagar?</div>

              {[
                {key:"pix",    label:"PIX",     icon:"⚡",sub:"Pagamento na hora com QR code"},
                {key:"cartao", label:"Cartão",   icon:"💳",sub:"Débito ou crédito na entrega/retirada"},
                {key:"dinheiro",label:"Dinheiro",icon:"💵",sub:"Informe se precisar de troco"},
              ].map(p=>(
                <div key={p.key} className={"radio-option"+(pagamento===p.key?" selected":"")} onClick={()=>setPagamento(p.key)}>
                  <div className="radio-dot"><div className="radio-dot-inner"/></div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14}}>{p.icon} {p.label}</div>
                    <div style={{fontSize:12,color:"#7a9ab5"}}>{p.sub}</div>
                  </div>
                </div>
              ))}

              {pagamento==="dinheiro"&&(
                <input className="input" placeholder="Troco para quanto? (ex: 100)" value={troco} onChange={e=>setTroco(e.target.value)} style={{marginTop:10}} inputMode="numeric"/>
              )}

              <div className="section-card" style={{marginTop:16}}>
                <div className="sub-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {tipoEntrega==="entrega"&&distanciaInfo?.faixa?.taxa!=null&&(
                  <div className="sub-row"><span>Taxa de entrega</span><span>{fmt(distanciaInfo.faixa.taxa)}</span></div>
                )}
                <hr className="divider"/>
                <div className="total-row"><span>Total</span><span style={{color:"#4a90c4"}}>{fmt(total)}</span></div>
              </div>

              <button className="btn-wpp" style={{marginTop:16}} disabled={!canStep3} onClick={confirmOrder}>
                📲 Enviar pedido via WhatsApp
              </button>
              <div style={{fontSize:12,color:"#7a9ab5",textAlign:"center",marginTop:8}}>
                Você será redirecionado para o WhatsApp com o pedido já formatado
              </div>
            </>}
          </div>
        </div>
      )}

      {/* MANUAL */}
      {showManual&&(
        <div className="overlay" onClick={()=>setShowManual(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-title">Lançar pedido manual</div>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <input className="input" placeholder="Nome do cliente" value={manualForm.nome} onChange={e=>setManualForm(f=>({...f,nome:e.target.value}))} style={{flex:2}}/>
              <input className="input" placeholder="Mesa/bairro" value={manualForm.mesa} onChange={e=>setManualForm(f=>({...f,mesa:e.target.value}))} style={{flex:1}}/>
            </div>
            <textarea className="input" placeholder="Descreva os itens..." value={manualForm.itens} onChange={e=>setManualForm(f=>({...f,itens:e.target.value}))} style={{marginBottom:10}}/>
            <textarea className="input" placeholder="Observações (opcional)" value={manualForm.obs} onChange={e=>setManualForm(f=>({...f,obs:e.target.value}))} style={{marginBottom:16}}/>
            <div style={{display:"flex",gap:10}}>
              <button className="btn-outline" style={{flex:1}} onClick={()=>setShowManual(false)}>Cancelar</button>
              <button className="btn-primary" style={{flex:2,width:"auto"}} disabled={!manualForm.itens} onClick={submitManual}>Lançar</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className="toast">{toast}</div>}
    </div>
  );
}
