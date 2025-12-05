"use client";

import React, { useState, useRef, useEffect } from "react";
import { SENTENCES } from "./sentences";

function getRandomSentence(except?: string) {
  const filtered = except ? SENTENCES.filter((s) => s !== except) : SENTENCES;
  const randomIdx = Math.floor(Math.random() * filtered.length);
  return filtered[randomIdx] || SENTENCES[0];
}

export default function Home() {
  const [target, setTarget] = useState(() => getRandomSentence());
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0); // 실시간 경과 시간
  const [result, setResult] = useState<null | {
    correct: boolean;
    time: number;
    accuracy: number;
    speed: number;
  }>(null);
  const [readyForRestart, setReadyForRestart] = useState(true); // true: 입력 중, false: 결과 후 딜레이, true: 결과 딜레이 후
  const inputRef = useRef<HTMLInputElement>(null);

  // 결과 나오면 재시작 대기타임 적용
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setReadyForRestart(true);
      }, 900); // 최소 0.9초간 재시작 차단
      return () => clearTimeout(timer);
    }
  }, [result]);

  // 실시간 경과 시간 업데이트 (입력 중일 때만)
  useEffect(() => {
    if (!startTime || endTime || result) return;
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 100) / 10); // 0.1초 단위
    }, 60);
    return () => clearInterval(interval);
  }, [startTime, endTime, result]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!startTime) setStartTime(Date.now());
    setInput(e.target.value);
  };

  const checkTyping = () => {
    if (input.length === 0 || !startTime) return;
    const now = Date.now();
    const timeSec = (now - startTime) / 1000;
    const correct = input.trim() === target.trim();
    // 정확도 계산
    const minLen = Math.min(target.length, input.length);
    let match = 0;
    for (let i = 0; i < minLen; i++) if (target[i] === input[i]) match++;
    const accuracy = (match / target.length) * 100;
    // 속도(타/분)
    const speed = Math.round((input.length / timeSec) * 60);
    setEndTime(now);
    setResult({ correct, time: timeSec, accuracy, speed });
    setReadyForRestart(false); // 결과 생성과 동시에 잠금
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!result) {
        checkTyping();
      } else if (readyForRestart) {
        handleRestart();
      }
    }
  };

  const handleRestart = () => {
    const next = getRandomSentence(target);
    setTarget(next);
    setInput("");
    setStartTime(null);
    setEndTime(null);
    setResult(null);
    setElapsed(0); // 여기서 초기화
    inputRef.current?.focus();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.3rem",
        background: "#fff",
        color: "#111",
      }}>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: 0,
          color: "#111",
        }}>
        타자 빨리치기
      </h1>
      <p
        style={{
          background: "#fff",
          color: "#222",
          padding: "1.5rem 2rem",
          borderRadius: 8,
          fontSize: "1.4rem",
          fontWeight: 700,
          letterSpacing: 0.5,
          boxShadow: "0 1px 6px #eee",
          marginBottom: 28,
          minHeight: 48,
        }}>
        {target}
      </p>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: "1.25rem",
          padding: 11,
          width: 440,
          border: "1.5px solid #bbb",
          borderRadius: 9,
          background: result ? "#f3f3f3" : "#fff",
          color: "#111",
          boxShadow: result ? "none" : "0 1px 4px #eee",
        }}
        placeholder="위 문장을 똑같이 입력하세요 (엔터로 제출/다시하기)"
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />
      <div
        style={{
          margin: "2.2rem 0",
          textAlign: "center",
          minHeight: 115,
          color: "#111",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
        }}>
        {result ? (
          <div>
            <div
              style={{
                fontSize: "1.13rem",
                fontWeight: 650,
                marginBottom: 10,
                color: result.correct ? "#111" : "#ef4047",
                transition: "color 0.2s",
                minHeight: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 140,
                whiteSpace: "pre",
              }}>
              {result.correct ? "정답! 🎉" : "틀렸어요"}
            </div>
            <div>⏱️ 시간: {result.time.toFixed(3)}초</div>
            <div>정확도: {result.accuracy.toFixed(1)}%</div>
            <div>속도: {result.speed}타/분</div>
          </div>
        ) : (
          <>
            <div style={{ minHeight: 28, width: 140 }}></div>
            <div>⏱️ 시간: {elapsed.toFixed(3)}초</div>
            <div>정확도: 0%</div>
            <div>속도: 0타/분</div>
          </>
        )}
      </div>
      <button
        onClick={handleRestart}
        style={{
          background: "#fff",
          color: "#111",
          border: "1px solid #bbb",
          borderRadius: 6,
          padding: "0.7rem 1.8rem",
          fontSize: "1.05rem",
          fontWeight: 600,
          cursor: "pointer",
        }}>
        다시하기
      </button>
      <div style={{ marginTop: 16, color: "#898989", fontSize: 14 }}>
        엔터로 제출/다시하기 모두 가능합니다
      </div>
    </main>
  );
}
