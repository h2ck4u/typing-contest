"use client";
import React, { useState, useRef, useEffect } from "react";
import { SENTENCE } from "../sentences";

interface RecordItem {
  sentence: string;
  time: number;
  originalIndex: number;
  id: string;
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
  const [isComposing, setIsComposing] = useState(false);

  // localStorage에서 기록 불러오기
  useEffect(() => {
    const savedRecords = localStorage.getItem("typing-contest-records");
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        setSuccessRecords(parsed);
      } catch (e) {
        console.error("Failed to parse saved records", e);
      }
    }
  }, []);

  // 기록이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (
      successRecords.length > 0 ||
      localStorage.getItem("typing-contest-records")
    ) {
      localStorage.setItem(
        "typing-contest-records",
        JSON.stringify(successRecords)
      );
    }
  }, [successRecords]);

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

  // 틀렸을 때 입력 필드 자동 포커스 및 선택
  useEffect(() => {
    if (result && !result.correct) {
      // 안내 문구가 보일 수 있도록 약간의 딜레이 후 포커스하고 선택
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [result]);

  useEffect(() => {
    if (!startTime || endTime) return;
    // 틀렸을 때도 시간이 계속 흐르도록 result가 있어도 타이머 유지
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 100) / 10);
    }, 60);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const handleCompositionStart = () => {
    // 성공 상태에서는 입력 막기
    if (result?.correct) return;
    setIsComposing(true);
    // 한글 입력 시작 시 즉시 타이머 시작
    if (!startTime && !result) {
      setStartTime(Date.now());
    }
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    // 성공 상태에서는 입력 막기
    if (result?.correct) {
      setIsComposing(false);
      return;
    }
    setIsComposing(false);
    // 조합이 끝난 후 실제 입력값으로 처리
    const newValue = e.currentTarget.value;

    // 조합이 끝난 후 시간 시작 (첫 글자 입력 시)
    if (newValue.length > 0 && !startTime && !result) {
      setStartTime(Date.now());
    }

    // result가 있고 입력이 변경되면 초기화 (틀렸을 때 재시도)
    if (result && newValue !== input) {
      if (newValue.length !== input.length || newValue.length > 0) {
        setResult(null);
        setEndTime(null);
        // 시간은 계속 흐르도록 startTime 유지 (초기화하지 않음)
        setInput(newValue);
        return;
      }
    }

    setInput(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 성공 상태에서는 입력 막기
    if (result?.correct) {
      e.target.value = input; // 입력값을 원래대로 복원
      return;
    }

    const newValue = e.target.value;

    // 조합 중일 때는 result 초기화하지 않음
    if (isComposing) {
      setInput(newValue);
      return;
    }

    // result가 있고 입력이 실제로 변경되면 초기화 (틀렸을 때 재시도)
    // 단, result가 설정된 직후에는 초기화하지 않음 (입력값이 완전히 바뀔 때만)
    if (result && newValue !== input) {
      // 입력값이 완전히 바뀌었거나 (길이가 다르거나, 내용이 다름)
      // 또는 입력값이 비어있지 않을 때만 초기화
      if (newValue.length !== input.length || newValue.length > 0) {
        setResult(null);
        setEndTime(null);
        // 시간은 계속 흐르도록 startTime 유지 (초기화하지 않음)
        setInput(newValue);
        return;
      }
    }

    // 입력이 시작될 때 시간 시작 (첫 글자 입력 시)
    if (newValue.length > 0 && !startTime && !result) {
      setStartTime(Date.now());
    }

    setInput(newValue);
  };

  const checkTyping = () => {
    // 조합 중일 때는 실행하지 않음
    if (isComposing) return;
    if (input.trim().length === 0 || !startTime) return;
    const now = Date.now();
    const timeSec = (now - startTime) / 1000;
    const correct = input.trim() === target.trim();
    const minLen = Math.min(target.length, input.length);
    let match = 0;
    for (let i = 0; i < minLen; i++) if (target[i] === input[i]) match++;
    const accuracy = (match / target.length) * 100;
    const speed = Math.round((input.length / timeSec) * 60);
    // 틀렸을 때는 endTime을 설정하지 않아서 시간이 계속 흐르도록 함
    if (correct) {
      setEndTime(now);
    }
    setResult({ correct, time: timeSec, accuracy, speed });
    setReadyForRestart(false);
    if (correct) {
      setInput("");
      setStartTime(null);
      setEndTime(null);
      setSuccessRecords((prev) => {
        // 마지막 회차만 삭제 가능하므로, 항상 가장 큰 회차 + 1을 사용
        const maxOriginalIndex =
          prev.length > 0 ? Math.max(...prev.map((r) => r.originalIndex)) : 0;
        const nextIndex = maxOriginalIndex + 1;

        const newRecord: RecordItem = {
          sentence: target,
          time: timeSec,
          originalIndex: nextIndex,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        };
        return [newRecord, ...prev];
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // 기본 동작 방지

      // 조합 중일 때는 조합을 취소하고 현재 입력값으로 확인
      if (isComposing) {
        setIsComposing(false);
        // 조합 취소 후 input의 현재 값을 읽어서 확인
        setTimeout(() => {
          if (!inputEnabled) return;
          const currentValue = inputRef.current?.value || input;
          // 현재 입력값으로 확인
          if (currentValue.trim().length === 0 || !startTime) return;
          const now = Date.now();
          const timeSec = (now - startTime) / 1000;
          const correct = currentValue.trim() === target.trim();
          const minLen = Math.min(target.length, currentValue.length);
          let match = 0;
          for (let i = 0; i < minLen; i++)
            if (target[i] === currentValue[i]) match++;
          const accuracy = (match / target.length) * 100;
          const speed = Math.round((currentValue.length / timeSec) * 60);
          // 틀렸을 때는 endTime을 설정하지 않아서 시간이 계속 흐르도록 함
          if (correct) {
            setEndTime(now);
          }
          setResult({ correct, time: timeSec, accuracy, speed });
          setReadyForRestart(false);
          if (correct) {
            setInput("");
            setStartTime(null);
            setEndTime(null);
            setSuccessRecords((prev) => {
              const existingIndices = prev
                .map((r) => r.originalIndex)
                .sort((a, b) => a - b);
              let nextIndex = 1;
              for (let i = 0; i < existingIndices.length; i++) {
                if (existingIndices[i] !== i + 1) {
                  nextIndex = i + 1;
                  break;
                }
                nextIndex = i + 2;
              }
              const newRecord: RecordItem = {
                sentence: target,
                time: timeSec,
                originalIndex: nextIndex,
                id:
                  Date.now().toString() +
                  Math.random().toString(36).substr(2, 9),
              };
              return [newRecord, ...prev];
            });
          }
        }, 50);
        return;
      }

      if (!result) {
        if (!inputEnabled) return;
        checkTyping();
      } else if (result?.correct && readyForRestart) {
        handleRestart();
      } else if (result && !result.correct) {
        // 틀렸을 때 엔터를 누르면 입력 필드 초기화하고 포커스
        // 시간은 계속 흐르도록 startTime 유지
        setInput("");
        setResult(null);
        setEndTime(null);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
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

  const handleDeleteRecord = (id: string) => {
    setSuccessRecords((prev) => {
      const deletedRecord = prev.find((rec) => rec.id === id);
      const filtered = prev.filter((rec) => rec.id !== id);

      // 삭제된 기록이 있으면, 삭제된 기록보다 큰 originalIndex를 가진 기록들을 1씩 감소
      if (deletedRecord) {
        return filtered.map((rec) => {
          if (rec.originalIndex > deletedRecord.originalIndex) {
            return { ...rec, originalIndex: rec.originalIndex - 1 };
          }
          return rec;
        });
      }
      return filtered;
    });
  };

  const handleClearRecords = () => {
    if (confirm("모든 기록을 삭제하시겠습니까?")) {
      localStorage.removeItem("typing-contest-records");
      setSuccessRecords([]);
    }
  };

  // 입력값과 예시문을 혼합하여 렌더링
  const renderMixedText = () => {
    const targetChars = target.split("");
    const inputChars = input.split("");

    return targetChars.map((char, idx) => {
      const inputChar = inputChars[idx];
      const isInputted = inputChar !== undefined;
      const isCorrect = isInputted && inputChar === char;
      const isWrong = isInputted && inputChar !== char;

      // 줄바꿈 처리
      if (char === "\n") {
        return <br key={idx} />;
      }

      // 입력한 부분
      if (isInputted) {
        return (
          <span
            key={idx}
            style={{
              color: isWrong ? "#ef4047" : "#222",
              fontWeight: 700,
              textDecoration: isWrong ? "line-through" : "none",
            }}>
            {inputChar}
          </span>
        );
      }

      // 입력하지 않은 부분은 예시문 표시 (위아래 애니메이션)
      // 시간이 시작된 후에만 애니메이션 실행
      const shouldAnimate = startTime !== null;
      // 성공했을 때 첫 글자만 빼고 블러 처리
      const shouldBlur = result?.correct === true;
      const isFirstChar = idx === 0;
      // 띄어쓰기는 특별 처리
      if (char === " ") {
        return (
          <span
            key={idx}
            style={{
              color: "#999",
              fontWeight: 400,
              display: "inline-block",
              animation: shouldAnimate
                ? `floatUpDown 2s ease-in-out infinite`
                : "none",
              animationDelay: shouldAnimate ? `${(idx % 5) * 0.1}s` : "0s",
              width: "0.25em",
              filter: shouldBlur && !isFirstChar ? "blur(3px)" : "none",
              transition: "filter 0.3s ease",
            }}>
            &nbsp;
          </span>
        );
      }
      return (
        <span
          key={idx}
          style={{
            color: "#999",
            fontWeight: 400,
            display: "inline-block",
            animation: shouldAnimate
              ? `floatUpDown 2s ease-in-out infinite`
              : "none",
            animationDelay: shouldAnimate ? `${(idx % 5) * 0.1}s` : "0s",
            filter: shouldBlur && !isFirstChar ? "blur(3px)" : "none",
            transition: "filter 0.3s ease",
          }}>
          {char}
        </span>
      );
    });
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
            fontSize: "3rem",
            fontWeight: 800,
            marginBottom: 30,
            color: "#111",
          }}>
          2025 모빌리티사업실 타자 대회
        </h1>
        {/* 예시문 및 입력 영역 */}
        <div
          style={{
            margin: "34px 0 28px 0",
            position: "relative",
            background:
              result && !result.correct
                ? "#fff5f5"
                : result && result.correct
                ? "#f3f3f3"
                : "#fff",
            borderRadius: 14,
            border:
              result && !result.correct
                ? "2px solid #ef4047"
                : result && result.correct
                ? "1.5px solid #149572"
                : "none",
            boxShadow:
              result && !result.correct
                ? "0 0 0 3px rgba(239, 64, 71, 0.1)"
                : result
                ? "none"
                : "0 1px 10px #eee",
            padding: "2rem 2.3rem",
            minWidth: 560,
            maxWidth: 700,
            minHeight: 62,
            cursor: "text",
            transition: "all 0.2s ease",
          }}
          onClick={() => inputRef.current?.focus()}>
          {/* 혼합 텍스트 (입력한 부분 + 예시문) */}
          <div
            style={{
              color: "#222",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: 0.25,
              whiteSpace: "pre-line",
              lineHeight: 1.54,
              textAlign: "center",
              wordBreak: "keep-all",
              userSelect: "none",
              pointerEvents: "none",
            }}>
            {input.length > 0
              ? renderMixedText()
              : target.split("").map((char, idx) => {
                  if (char === "\n") {
                    return <br key={idx} />;
                  }
                  // 시간이 시작된 후에만 애니메이션 실행
                  const shouldAnimate = startTime !== null;
                  // 시작 전이나 성공했을 때 첫 글자만 빼고 블러 처리
                  const shouldBlur =
                    (input.length === 0 && startTime === null) ||
                    result?.correct === true;
                  const isFirstChar = idx === 0;
                  if (char === " ") {
                    return (
                      <span
                        key={idx}
                        style={{
                          color: "#999",
                          fontWeight: 400,
                          display: "inline-block",
                          animation: shouldAnimate
                            ? `floatUpDown 2s ease-in-out infinite`
                            : "none",
                          animationDelay: shouldAnimate
                            ? `${(idx % 5) * 0.1}s`
                            : "0s",
                          width: "0.25em",
                          filter:
                            shouldBlur && !isFirstChar ? "blur(3px)" : "none",
                          transition: "filter 0.3s ease",
                        }}>
                        &nbsp;
                      </span>
                    );
                  }
                  return (
                    <span
                      key={idx}
                      style={{
                        color: "#999",
                        fontWeight: 400,
                        display: "inline-block",
                        animation: shouldAnimate
                          ? `floatUpDown 2s ease-in-out infinite`
                          : "none",
                        animationDelay: shouldAnimate
                          ? `${(idx % 5) * 0.1}s`
                          : "0s",
                        filter:
                          shouldBlur && !isFirstChar ? "blur(3px)" : "none",
                        transition: "filter 0.3s ease",
                      }}>
                      {char}
                    </span>
                  );
                })}
          </div>
          {/* 숨겨진 input (키보드 입력용) */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              padding: 0,
              border: "none",
              outline: "none",
              cursor: "text",
              background: "transparent",
            }}
            autoFocus
            spellCheck={false}
            autoComplete="new-password"
          />
        </div>
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
            <div style={{ width: "100%" }}>
              <div
                style={{
                  fontSize: "1.13rem",
                  fontWeight: 650,
                  marginBottom: result.correct ? 10 : 6,
                  color: result.correct ? "#149572" : "#ef4047",
                  transition: "color 0.2s",
                  height: 28,
                  lineHeight: "28px",
                  textAlign: "center",
                  whiteSpace: "pre",
                  opacity: 1,
                }}>
                {result.correct ? "성공했어요!" : "틀렸어요"}
              </div>
              {/* 안내문구 - 항상 공간을 차지하도록 (레이아웃 시프트 방지) */}
              <div
                style={{
                  height: 20,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: result.correct ? "transparent" : "#ef4047",
                  marginBottom: 10,
                  lineHeight: "20px",
                  textAlign: "center",
                  transition: "color 0.2s",
                }}>
                {result.correct
                  ? "\u00A0"
                  : "다시 타이핑하거나 엔터를 눌러 재시도하세요"}
              </div>
              {/* 틀렸을 때는 계속 흐르는 시간 표시, 성공했을 때는 결과 시간 표시 */}
              <div>
                ⏱️ 시간:{" "}
                {result.correct ? result.time.toFixed(3) : elapsed.toFixed(3)}초
              </div>
              <div>정확도: {result.accuracy.toFixed(1)}%</div>
              <div>속도: {result.speed}타/분</div>
            </div>
          ) : (
            <>
              <div style={{ height: 28, marginBottom: 6 }}></div>
              <div style={{ height: 20, marginBottom: 10 }}></div>
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
      </section>
      {/* 성공 기록 사이드바 */}
      <aside
        style={{
          minWidth: 0,
          width: 330,
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "84%",
            paddingBottom: 19,
            borderBottom: "1px solid #e9e9e9",
            marginBottom: 18,
          }}>
          <div
            style={{
              fontWeight: 750,
              fontSize: "1.12rem",
              color: "#1c2538",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}>
            성공 기록
          </div>
          {successRecords.length > 0 && (
            <button
              onClick={handleClearRecords}
              style={{
                background: "transparent",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: "0.85rem",
                padding: "4px 8px",
                borderRadius: 4,
                marginLeft: 8,
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4047";
                e.currentTarget.style.backgroundColor =
                  "rgba(239, 64, 71, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#999";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="모든 기록 삭제">
              초기화
            </button>
          )}
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
            (() => {
              const sortedRecords = [...successRecords]
                .sort((a, b) => a.time - b.time)
                .slice(0, 15);
              const bestTime = sortedRecords[0]?.time;
              // 마지막 회차 찾기 (originalIndex가 가장 큰 값)
              const maxOriginalIndex = Math.max(
                ...successRecords.map((r) => r.originalIndex),
                0
              );
              return sortedRecords.map((rec, idx) => {
                const isBest = rec.time === bestTime;
                const isLastRecord = rec.originalIndex === maxOriginalIndex;
                return (
                  <li
                    key={rec.id}
                    style={{
                      background: isBest ? "#fff8e1" : "#fff",
                      border: isBest
                        ? "2px solid #ffc107"
                        : "1px solid #d6d8e0",
                      borderRadius: 8,
                      fontSize: 14.4,
                      padding: "0.75rem 1.1rem",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 3,
                      boxShadow: isBest
                        ? "0 2px 8px #ffc10740"
                        : "0 1px 5px #e0e5f3",
                      color: "#202634",
                      minWidth: 0,
                      position: "relative",
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, marginBottom: 1 }}>
                        [{idx + 1}위, {rec.originalIndex}회차]{" "}
                        <span
                          style={{
                            color: isBest ? "#f57c00" : "#1976d1",
                            fontWeight: isBest ? 700 : 500,
                          }}>{` (${rec.time.toFixed(3)}초)`}</span>
                        {isBest && (
                          <span
                            style={{
                              color: "#f57c00",
                              fontWeight: 700,
                              marginLeft: 6,
                            }}>
                            ⭐ 최고 기록
                          </span>
                        )}
                      </div>
                    </div>
                    {isLastRecord && (
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#999",
                          cursor: "pointer",
                          fontSize: "18px",
                          padding: "0 4px",
                          lineHeight: 1,
                          opacity: 0.6,
                          transition: "opacity 0.2s",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.color = "#ef4047";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "0.6";
                          e.currentTarget.style.color = "#999";
                        }}
                        title="삭제">
                        ×
                      </button>
                    )}
                  </li>
                );
              });
            })()
          )}
        </ul>
      </aside>
    </main>
  );
}
