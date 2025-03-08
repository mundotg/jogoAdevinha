"use client"
import { useState, useEffect } from "react";
import { create } from "zustand";

// Estado global com Zustand
const useGameStore = create((set) => ({
  numberToGuess: Math.floor(Math.random() * 100) + 1,
  attempts: 0,
  bestScore: localStorage.getItem("bestScore") ? parseInt(localStorage.getItem("bestScore")) : null,
  gameState: "playing", // playing, won, lost
  history: [],
  resetGame: () => set((state:any) => ({
    numberToGuess: Math.floor(Math.random() * 100) + 1,
    attempts: 0,
    gameState: "playing",
    history: []
  })),
  addAttempt: (guess) => set(state => ({
    attempts: state.attempts + 1,
    history: [...state.history, { guess, isHigh: guess > state.numberToGuess, isLow: guess < state.numberToGuess }]
  })),
  setGameState: (newState) => set(state => {
    // Se o jogador venceu, atualiza o melhor placar
    if (newState === "won") {
      const newBestScore = state.bestScore === null || state.attempts < state.bestScore 
        ? state.attempts 
        : state.bestScore;
      
      localStorage.setItem("bestScore", newBestScore);
      return { gameState: newState, bestScore: newBestScore };
    }
    return { gameState: newState };
  }),
}));

export default function Home() {
  const { 
    numberToGuess, 
    attempts, 
    bestScore, 
    gameState, 
    history, 
    resetGame, 
    addAttempt, 
    setGameState 
  } = useGameStore();
  
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [chatbotResponse, setChatbotResponse] = useState("Olá! Adivinhe um número entre 1 e 100.");
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [animation, setAnimation] = useState("");

  useEffect(() => {
    // Verificar se há um bestScore no localStorage na inicialização
    const savedBestScore = localStorage.getItem("bestScore");
    if (savedBestScore) {
      useGameStore.setState({ bestScore: parseInt(savedBestScore) });
    }
  }, []);

  const handleGuess = () => {
    const num = parseInt(guess, 10);

    // Validação da entrada
    if (isNaN(num) || num < 1 || num > 100) {
      setFeedback("Por favor, insira um número válido entre 1 e 100.");
      setAnimation("shake");
      setTimeout(() => setAnimation(""), 500);
      return;
    }

    // Verificar se o número já foi tentado
    if (history.some(h => h.guess === num)) {
      setFeedback("Você já tentou esse número!");
      setAnimation("shake");
      setTimeout(() => setAnimation(""), 500);
      return;
    }

    // Adicionar a tentativa ao histórico
    addAttempt(num);

    // Verificar se o jogador acertou
    if (num === numberToGuess) {
      setGameState("won");
      setFeedback("🎉 Parabéns! Você acertou!");
      setChatbotResponse(`Incrível! Você conseguiu em ${attempts + 1} tentativas!`);
      setAnimation("success");
      setTimeout(() => setAnimation(""), 1500);
    } else if (num > numberToGuess) {
      setFeedback("📉 Muito alto!");
      setChatbotResponse(getRandomHint("high"));
      setAnimation("wrong");
      setTimeout(() => setAnimation(""), 500);
    } else {
      setFeedback("📈 Muito baixo!");
      setChatbotResponse(getRandomHint("low"));
      setAnimation("wrong");
      setTimeout(() => setAnimation(""), 500);
    }

    // Limpar o campo de entrada
    setGuess("");

    // Verificar se o jogador perdeu (mais de 10 tentativas)
    if (attempts + 1 >= 10 && num !== numberToGuess) {
      setGameState("lost");
      setFeedback(`😢 Você perdeu! O número era ${numberToGuess}.`);
      setChatbotResponse("Não desista! Tente novamente!");
    }
  };

  const getRandomHint = (type) => {
    const highHints = [
      "Tente um número menor!",
      "Está muito alto, diminua um pouco.",
      "O número que procura é menor que esse.",
      "Vá para baixo!"
    ];

    const lowHints = [
      "Tente um número maior!",
      "Está muito baixo, aumente um pouco.",
      "O número que procura é maior que esse.",
      "Vá para cima!"
    ];

    const hints = type === "high" ? highHints : lowHints;
    return hints[Math.floor(Math.random() * hints.length)];
  };

  const getHint = () => {
    setHintUsed(true);
    setShowHint(true);
    
    // Calcular uma dica útil baseada nas tentativas anteriores
    let minGuess = 1;
    let maxGuess = 100;
    
    history.forEach(h => {
      if (h.isLow && h.guess > minGuess) minGuess = h.guess;
      if (h.isHigh && h.guess < maxGuess) maxGuess = h.guess;
    });
    
    setChatbotResponse(`O número está entre ${minGuess} e ${maxGuess}. Tente o valor médio!`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && gameState === "playing") {
      handleGuess();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white p-5">
      <div className={`bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full ${animation}`}>
        <h1 className="text-4xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Jogo de Adivinhação
        </h1>
        
        {bestScore !== null && (
          <div className="text-center mb-4 text-yellow-300">
            <span className="font-semibold">Melhor Pontuação:</span> {bestScore} tentativas
          </div>
        )}

        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Tentativas: {attempts}/10</span>
            <span className={attempts > 7 ? "text-red-400" : "text-green-400"}>
              {10 - attempts} restantes
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-green-400 to-red-500 h-2.5 rounded-full" 
              style={{ width: `${attempts * 10}%` }}
            ></div>
          </div>
        </div>

        <p className={`text-xl text-center mb-6 font-medium ${gameState === "won" ? "text-green-400" : gameState === "lost" ? "text-red-400" : "text-blue-300"}`}>
          {feedback || "Tente adivinhar o número entre 1 e 100!"}
        </p>

        {gameState === "playing" && (
          <>
            <div className="flex space-x-2 mb-4">
              <input
                type="number"
                min="1"
                max="100"
                className="p-3 rounded-lg flex-grow text-black text-lg font-medium"
                placeholder="Digite um número..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={gameState !== "playing"}
              />
              <button 
                onClick={handleGuess} 
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                disabled={gameState !== "playing"}
              >
                Tentar
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <button 
                onClick={getHint} 
                className={`text-sm px-4 py-2 rounded-md transition-all ${hintUsed ? "bg-gray-600 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"}`}
                disabled={hintUsed}
              >
                {hintUsed ? "Dica Usada" : "Pedir Dica"}
              </button>
            </div>
          </>
        )}

        {gameState !== "playing" && (
          <div className="flex justify-center mb-6">
            <button 
              onClick={resetGame} 
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-medium"
            >
              Jogar Novamente
            </button>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🤖</div>
            <div>
              <p className="text-yellow-300 font-medium">Assistente:</p>
              <p className="text-gray-200">{chatbotResponse}</p>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-300 mb-2">Histórico de Tentativas:</h3>
            <div className="grid grid-cols-5 gap-2">
              {history.map((item, index) => (
                <div 
                  key={index}
                  className={`p-2 text-center rounded ${
                    item.guess === numberToGuess 
                      ? "bg-green-600" 
                      : item.isHigh 
                        ? "bg-red-700" 
                        : "bg-blue-700"
                  }`}
                >
                  {item.guess}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .shake {
          animation: shake 0.5s;
        }
        
        .success {
          animation: pulse 1.5s;
        }
        
        .wrong {
          animation: flash 0.5s;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); background-color: rgba(34, 197, 94, 0.2); }
        }
        
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}