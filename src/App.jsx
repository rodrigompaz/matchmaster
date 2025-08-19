import React from 'react';

// --- Helper Functions & Constants ---

// Exponential backoff function for API retries
const fetchWithBackoff = async (url, options, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response.json();
      }
      if (response.status >= 400 && response.status < 500) {
        console.error("Client error:", response.status, await response.text());
        throw new Error(`Error del cliente: ${response.status}`);
      }
    } catch (error) {
       console.error(`Intento ${i + 1} fallido:`, error);
       if (i === retries - 1) throw error;
    }
    await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
  }
};

// --- Icon Components (Inline SVG for simplicity) ---

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.8 5.8-1.9-5.8-1.9L12 3z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
);
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const PenSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const MessageSquareReplyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="m10 7-3 3 3 3" /><path d="M13 13V7h7" /></svg>
);


// --- Main App Component ---
export default function App() {
  // State management
  const [activeTab, setActiveTab] = React.useState('opener');
  const [imageFile, setImageFile] = React.useState(null);
  const [imageBase64, setImageBase64] = React.useState('');
  const [suggestions, setSuggestions] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copiedKey, setCopiedKey] = React.useState(null);

  // State for Bio Improver
  const [userBio, setUserBio] = React.useState('');
  const [bioSuggestions, setBioSuggestions] = React.useState(null);
  const [isBioLoading, setIsBioLoading] = React.useState(false);
  const [bioError, setBioError] = React.useState('');

  // State for Reply Analyzer
  const [replyText, setReplyText] = React.useState('');
  const [replySuggestions, setReplySuggestions] = React.useState(null);
  const [isReplyLoading, setIsReplyLoading] = React.useState(false);
  const [replyError, setReplyError] = React.useState('');


  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSuggestions(null);
      setReplySuggestions(null);
      setReplyText('');
      setError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result);
      reader.onerror = () => setError('No se pudo leer el archivo de imagen.');
      reader.readAsDataURL(file);
    }
  };

  const getOpenerSuggestions = async () => {
    if (!imageBase64) return setError('Por favor, sube una captura de pantalla primero.');
    setIsLoading(true);
    setError('');
    setSuggestions(null);
    setReplySuggestions(null);

    const cleanBase64 = imageBase64.split(',')[1];
    const prompt = `Actúa como un experto en citas online. Analiza esta captura de pantalla de un perfil. Basándote en las fotos y la biografía, genera 3 opciones de primer mensaje: 1. **Casual Picante**: Coqueto y divertido. 2. **Lo que surja**: Relajado y observador. 3. **Romántico**: Dulce y genuino. Devuelve únicamente un objeto JSON con las claves "casual_picante", "lo_que_surja", "romantico".`;
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            "casual_picante": { "type": "STRING" },
            "lo_que_surja": { "type": "STRING" },
            "romantico": { "type": "STRING" }
          },
          required: ["casual_picante", "lo_que_surja", "romantico"]
        }
      }
    };
    
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
      const result = await fetchWithBackoff(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) setSuggestions(JSON.parse(responseText));
      else throw new Error("La respuesta de la API no tuvo el formato esperado.");
    } catch (err) {
      console.error("API Error:", err);
      setError('Hubo un problema al generar las sugerencias.');
    } finally {
      setIsLoading(false);
    }
  };

  const getBioSuggestions = async () => {
      if (!userBio.trim()) return setBioError('Por favor, escribe tu biografía actual.');
      setIsBioLoading(true);
      setBioError('');
      setBioSuggestions(null);

      const prompt = `Actúa como un coach de citas experto. Revisa la siguiente biografía de una app de citas: "${userBio}". Ofrece 3 versiones mejoradas con diferentes enfoques: 1. **Divertida**: ingeniosa y que provoque una sonrisa. 2. **Directa**: Sincera, clara y mostrando intenciones. 3. **Intrigante**: Misteriosa y que genere ganas de preguntar más. Devuelve únicamente un objeto JSON con las claves "divertida", "directa", "intrigante".`;
      const payload = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: "OBJECT",
                  properties: { "divertida": { "type": "STRING" }, "directa": { "type": "STRING" }, "intrigante": { "type": "STRING" } },
                  required: ["divertida", "directa", "intrigante"]
              }
          }
      };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      try {
          const result = await fetchWithBackoff(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) setBioSuggestions(JSON.parse(responseText));
          else throw new Error("La respuesta de la API no tuvo el formato esperado.");
      } catch (err) {
          console.error("API Error:", err);
          setBioError('Hubo un problema al mejorar tu biografía.');
      } finally {
          setIsBioLoading(false);
      }
  };

  const getReplySuggestions = async () => {
      if (!replyText.trim()) return setReplyError('Por favor, introduce la respuesta que recibiste.');
      setIsReplyLoading(true);
      setReplyError('');
      setReplySuggestions(null);

      const prompt = `Actúa como un experto en conversaciones de apps de citas. Un usuario ha recibido la siguiente respuesta: "${replyText}". Genera 3 opciones de respuesta ingeniosas y atractivas para continuar la conversación de forma fluida. Devuelve únicamente un objeto JSON con las claves "respuesta1", "respuesta2", "respuesta3".`;
      const payload = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: "OBJECT",
                  properties: { "respuesta1": { "type": "STRING" }, "respuesta2": { "type": "STRING" }, "respuesta3": { "type": "STRING" } },
                  required: ["respuesta1", "respuesta2", "respuesta3"]
              }
          }
      };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      try {
          const result = await fetchWithBackoff(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) setReplySuggestions(JSON.parse(responseText));
          else throw new Error("La respuesta de la API no tuvo el formato esperado.");
      } catch (err) {
          console.error("API Error:", err);
          setReplyError('Hubo un problema al analizar la respuesta.');
      } finally {
          setIsReplyLoading(false);
      }
  };
  
  const handleCopyToClipboard = (text, key) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const openerSuggestionCards = [
    { key: 'casual_picante', title: '🌶️ Casual Picante' },
    { key: 'lo_que_surja', title: '🤔 Lo que surja' },
    { key: 'romantico', title: '💖 Romántico' }
  ];

  const bioSuggestionCards = [
      { key: 'divertida', title: '😂 Divertida' },
      { key: 'directa', title: '🎯 Directa' },
      { key: 'intrigante', title: '✨ Intrigante' }
  ];

  const replySuggestionCards = [
      { key: 'respuesta1', title: '😎 Opción 1' },
      { key: 'respuesta2', title: '🤓 Opción 2' },
      { key: 'respuesta3', title: '😏 Opción 3' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500">
            Match Master
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Domina el arte de la conversación con IA.
          </p>
        </header>

        <div className="flex justify-center mb-6 border-b border-gray-200">
            <button onClick={() => setActiveTab('opener')} className={`px-4 py-2 text-lg font-semibold transition-colors duration-300 ${activeTab === 'opener' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-500'}`}>Generar Mensajes</button>
            <button onClick={() => setActiveTab('bio')} className={`px-4 py-2 text-lg font-semibold transition-colors duration-300 ${activeTab === 'bio' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-500'}`}>Mejora mi Biografía</button>
        </div>

        <main className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {activeTab === 'opener' && (
            <div>
              <p className="text-center text-gray-600 mb-6">
                Sube una captura del perfil que te interesa. La IA analizará sus fotos y bio para darte tres opciones de primer mensaje y romper el hielo con estilo.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <label htmlFor="file-upload" className="relative cursor-pointer w-full h-64 sm:h-80 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-pink-400 hover:bg-gray-50 transition-all duration-300">
                    {imageBase64 ? <img src={imageBase64} alt="Previsualización" className="object-contain w-full h-full rounded-xl p-2" /> : <div className="text-center text-gray-500"><UploadIcon /><span className="mt-2 block font-semibold">Sube una captura</span><span className="text-sm">PNG, JPG, WEBP</span></div>}
                  </label>
                  <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                  <button onClick={getOpenerSuggestions} disabled={!imageBase64 || isLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {isLoading ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generando...</> : <><SparklesIcon />Generar Mensajes</>}
                  </button>
                  {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                </div>
                <div className="flex flex-col space-y-4">
                  {!suggestions && !isLoading && <div className="h-full flex items-center justify-center text-gray-400 text-center bg-gray-50 rounded-xl p-8"><p>Tus mensajes personalizados aparecerán aquí.</p></div>}
                  {isLoading && <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse"><div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div><div className="h-8 bg-gray-300 rounded w-full"></div></div>)}</div>}
                  {suggestions && openerSuggestionCards.map(card => (
                    <div key={card.key} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 text-gray-800">{card.title}</h3>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-gray-600 flex-grow">{suggestions[card.key]}</p>
                          <button onClick={() => handleCopyToClipboard(suggestions[card.key], card.key)} className="flex-shrink-0 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" aria-label="Copiar">
                            {copiedKey === card.key ? <CheckIcon /> : <CopyIcon />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {suggestions && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="text-xl font-semibold text-center mb-4">¿Te han respondido? ✨</h3>
                          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Pega su respuesta aquí..." className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition"></textarea>
                          <button onClick={getReplySuggestions} disabled={isReplyLoading} className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-800 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50">
                              {isReplyLoading ? 'Analizando...' : <><MessageSquareReplyIcon /> Analiza la Respuesta</>}
                          </button>
                          {replyError && <p className="text-red-500 text-center mt-2">{replyError}</p>}
                          {isReplyLoading && <div className="space-y-4 mt-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse"><div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div><div className="h-8 bg-gray-300 rounded w-full"></div></div>)}</div>}
                          {replySuggestions && <div className="mt-4 space-y-4">{replySuggestionCards.map(card => (
                              <div key={card.key} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                  <div className="p-4">
                                      <h3 className="font-bold text-lg mb-2 text-gray-800">{card.title}</h3>
                                      <div className="flex items-center justify-between gap-2">
                                          <p className="text-gray-600 flex-grow">{replySuggestions[card.key]}</p>
                                          <button onClick={() => handleCopyToClipboard(replySuggestions[card.key], card.key)} className="flex-shrink-0 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600" aria-label="Copiar">{copiedKey === card.key ? <CheckIcon /> : <CopyIcon />}</button>
                                      </div>
                                  </div>
                              </div>
                          ))}</div>}
                      </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'bio' && (
            <div>
                <h2 className="text-2xl font-bold text-center mb-4">✨ Mejora tu Biografía</h2>
                <p className="text-center text-gray-600 mb-6">
                  Tu biografía es tu carta de presentación. Pega la tuya aquí y deja que la IA la transforme en tres versiones irresistibles: una divertida, una directa y otra intrigante.
                </p>
                <textarea value={userBio} onChange={(e) => setUserBio(e.target.value)} placeholder="Escribe o pega aquí tu biografía actual..." className="w-full h-32 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition mb-4"></textarea>
                <button onClick={getBioSuggestions} disabled={isBioLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50">
                    {isBioLoading ? 'Mejorando...' : <><PenSquareIcon /> ¡Dame ideas!</>}
                </button>
                {bioError && <p className="text-red-500 text-center mt-2">{bioError}</p>}
                
                <div className="mt-6">
                    {!bioSuggestions && !isBioLoading && <div className="h-full flex items-center justify-center text-gray-400 text-center bg-gray-50 rounded-xl p-8"><p>Las sugerencias para tu biografía aparecerán aquí.</p></div>}
                    {isBioLoading && <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse"><div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div><div className="h-8 bg-gray-300 rounded w-full"></div></div>)}</div>}
                    {bioSuggestions && <div className="space-y-4">{bioSuggestionCards.map(card => (
                        <div key={card.key} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-2 text-gray-800">{card.title}</h3>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-gray-600 flex-grow">{bioSuggestions[card.key]}</p>
                                    <button onClick={() => handleCopyToClipboard(bioSuggestions[card.key], card.key)} className="flex-shrink-0 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600" aria-label="Copiar">{copiedKey === card.key ? <CheckIcon /> : <CopyIcon />}</button>
                                </div>
                            </div>
                        </div>
                    ))}</div>}
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
