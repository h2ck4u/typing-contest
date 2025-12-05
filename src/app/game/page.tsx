"use client";
import React, { useState, useRef, useEffect } from "react";
import { SENTENCE } from "../sentences";

interface RecordItem {
  sentence: string;
  time: number;
}

export default function TypingGamePage() {
  const target = SENTENCE;
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<null | {
    correct: boolean;
    time: number;
    accuracy: number;
    speed: number;
  }>(null);
  const [readyForRestart, setReadyForRestart] = useState(true);
  const [successRecords, setSuccessRecords] = useState<RecordItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputEnabled, setInputEnabled] = useState(true);

  useEffect(() => {
    setInput("");
    setTimeout(() => {
      setInputEnabled(true);
      inputRef.current?.focus();
    }, 350);
    setStartTime(null);
    setEndTime(null);
    setResult(null);
    setElapsed(0);
  }, []);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setReadyForRestart(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [result]);

  useEffect(() => {
    if (!startTime || endTime || result) return;
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 100) / 10);
    }, 60);
    return () => clearInterval(interval);
  }, [startTime, endTime, result]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (result) {
      setResult(null);
      setStartTime(null);
      setEndTime(null);
      setElapsed(0);
    }
    if (!startTime) setStartTime(Date.now());
    setInput(e.target.value);
  };

  const checkTyping = () => {
    if (input.trim().length === 0 || !startTime) return;
    const now = Date.now();
    const timeSec = (now - startTime) / 1000;
    const correct = input.trim() === target.trim();
    const minLen = Math.min(target.length, input.length);
    let match = 0;
    for (let i = 0; i < minLen; i++) if (target[i] === input[i]) match++;
    const accuracy = (match / target.length) * 100;
    const speed = Math.round((input.length / timeSec) * 60);
    setEndTime(now);
    setResult({ correct, time: timeSec, accuracy, speed });
    setReadyForRestart(false);
    if (correct) {
      setSuccessRecords((prev) => [
        { sentence: target, time: timeSec },
        ...prev,
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!result) {
        if (!inputEnabled) return;
        checkTyping();
      } else if (result?.correct && readyForRestart) {
        handleRestart();
      }
    }
  };

  const handleRestart = () => {
    if (result?.correct) {
      setInput("");
      setStartTime(null);
      setEndTime(null);
      setResult(null);
      setElapsed(0);
      inputRef.current?.focus();
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#fff",
        color: "#111",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "stretch",
        boxSizing: "border-box",
      }}>
      {/* 중앙 타자 게임만 */}
      <section
        style={{
          flex: "1 1 700px",
          minWidth: 560,
          maxWidth: 800,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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
        {/* 문장(길~게!) */}
        <div
          style={{
            margin: "34px 0 28px 0",
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 1px 10px #eee",
            padding: "2rem 2.3rem",
            minWidth: 560,
            maxWidth: 700,
            color: "#222",
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: 0.25,
            minHeight: 62,
            whiteSpace: "pre-line",
            lineHeight: 1.54,
            textAlign: "center",
            wordBreak: "keep-all",
          }}>
          {target}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{
            fontSize: "1.15rem",
            padding: 13,
            width: 560,
            border: "1.5px solid #bbb",
            borderRadius: 9,
            background: result ? "#f3f3f3" : "#fff",
            color: "#111",
            boxShadow: result ? "none" : "0 1px 4px #eee",
            marginBottom: 6,
          }}
          placeholder="위 문장을 똑같이 입력하세요 (엔터로 제출/다시하기)"
          autoFocus
          spellCheck={false}
          autoComplete="new-password"
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
                  color: result.correct ? "#149572" : "#ef4047",
                  transition: "color 0.2s",
                  minHeight: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 140,
                  whiteSpace: "pre",
                }}>
                {result.correct ? "성공했어요!" : "틀렸어요"}
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
          onClick={result?.correct ? handleRestart : undefined}
          disabled={!result?.correct}
          style={{
            background: result?.correct ? "#fff" : "#f4f4f4",
            color: result?.correct ? "#111" : "#babcbc",
            border: "1px solid #bbb",
            borderRadius: 6,
            padding: "0.7rem 1.8rem",
            fontSize: "1.05rem",
            fontWeight: 600,
            cursor: result?.correct ? "pointer" : "not-allowed",
            opacity: result?.correct ? 1 : 0.57,
            transition: "all 0.16s",
          }}>
          다시하기
        </button>
        {result?.correct && (
          <div style={{ marginTop: 16, color: "#898989", fontSize: 14 }}>
            엔터로도 다음 문제로 이동할 수 있습니다
          </div>
        )}
      </section>
      {/* 성공 기록 사이드바 */}
      <aside
        style={{
          minWidth: 0,
          width: 280,
          background: "rgba(248,249,253,0.8)",
          boxShadow: "0 4px 32px #eef3ff30",
          borderLeft: "1.5px solid #eef1f5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 38,
        }}>
        <div
          style={{
            fontWeight: 750,
            fontSize: "1.12rem",
            paddingBottom: 19,
            color: "#1c2538",
            letterSpacing: 0.5,
            borderBottom: "1px solid #e9e9e9",
            width: "84%",
            textAlign: "center",
            marginBottom: 18,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
          성공 기록
        </div>
        {/* 평균 기록 표시 */}
        <div
          style={{
            marginBottom: 13,
            marginTop: -4,
            color: "#2166c8",
            fontSize: 15,
            fontWeight: 600,
          }}>
          평균 기록 :{" "}
          {successRecords.length > 0
            ? (
                successRecords.reduce((acc, cur) => acc + cur.time, 0) /
                successRecords.length
              ).toFixed(3)
            : "--"}
          초
        </div>
        <ul
          style={{
            width: "88%",
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 13,
            maxHeight: "60vh",
            overflowY: "auto",
          }}>
          {successRecords.length === 0 ? (
            <li
              style={{
                color: "#a2a5ae",
                textAlign: "center",
                marginTop: 30,
                fontSize: 15,
              }}>
              – 성공 기록 없음 –
            </li>
          ) : (
            successRecords.slice(0, 15).map((rec, idx) => (
              <li
                key={idx}
                style={{
                  background: "#fff",
                  border: "1px solid #d6d8e0",
                  borderRadius: 8,
                  fontSize: 14.4,
                  padding: "0.75rem 1.1rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 3,
                  boxShadow: "0 1px 5px #e0e5f3",
                  color: "#202634",
                  minWidth: 0,
                }}>
                <div style={{ fontWeight: 700, marginBottom: 1 }}>
                  [{successRecords.length - idx}회]{" "}
                  <span
                    style={{
                      color: "#1976d1",
                      fontWeight: 500,
                    }}>{` (${rec.time.toFixed(3)}초)`}</span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 240,
                  }}>
                  {rec.sentence}
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </main>
  );
}
