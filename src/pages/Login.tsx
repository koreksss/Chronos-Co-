import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5000";

interface Client {
  ClientID: number;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
}

// Форматирование российского номера телефона
function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  let result = "+7";

  if (digits.length > 0) {
    result += " (" + digits.slice(0, 3);
  }

  if (digits.length >= 3) {
    result += ")";
  }

  if (digits.length > 3) {
    result += " " + digits.slice(3, 6);
  }

  if (digits.length > 6) {
    result += "-" + digits.slice(6, 8);
  }

  if (digits.length > 8) {
    result += "-" + digits.slice(8, 10);
  }

  return result;
}

// Иконка глаза
function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.9" />
          <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.2 0 2.3-.2 3.3-.6" />
        </>
      )}
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (isRegister && phone.replace(/\D/g, "").length !== 11) {
      setError("Введите полный номер телефона");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isRegister
              ? {
                  FirstName: firstName.trim(),
                  LastName: lastName.trim(),
                  Phone: phone,
                  Email: email.trim(),
                  Password: password,
                }
              : {
                  Email: email.trim(),
                  Password: password,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Произошла ошибка");
      }

      const client: Client = data.client;

      // Сохраняем данные пользователя
      localStorage.setItem("client", JSON.stringify(client));

      // Показываем уведомление
      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: {
            message: isRegister
              ? `Аккаунт успешно создан! Добро пожаловать, ${client.FirstName}!`
              : `Вы успешно вошли! Добро пожаловать, ${client.FirstName}!`,
            type: "success",
          },
        })
      );

      // Переходим на главную страницу
      navigate("/");
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Не удалось подключиться к серверу. Проверьте, запущен ли Backend."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Произошла неизвестная ошибка"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Header />

      <main className="auth-main">
        <div className="auth-card">
          <p className="auth-label">CHRONOS & CO</p>

          <h1>{isRegister ? "Создать аккаунт" : "Добро пожаловать"}</h1>

          <p className="auth-description">
            {isRegister
              ? "Присоединяйтесь к миру часового искусства"
              : "Войдите в свой личный кабинет"}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={!isRegister ? "active" : ""}
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
            >
              Вход
            </button>

            <button
              type="button"
              className={isRegister ? "active" : ""}
              onClick={() => {
                setIsRegister(true);
                setError("");
              }}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <>
                <label>
                  Имя
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Введите имя"
                    required
                  />
                </label>

                <label>
                  Фамилия
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Введите фамилию"
                    required
                  />
                </label>

                <label>
                  Телефон
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="+7 (900) 000-00-00"
                    required
                  />
                </label>
              </>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.ru"
                required
              />
            </label>

            <label>
              Пароль
              <div className="auth-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Не менее 8 символов"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </label>

            {isRegister && (
              <label>
                Повторите пароль
                <div className="auth-password-field">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Введите пароль ещё раз"
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Скрыть пароль"
                        : "Показать пароль"
                    }
                  >
                    <EyeIcon visible={showConfirmPassword} />
                  </button>
                </div>
              </label>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Подождите..."
                : isRegister
                  ? "Зарегистрироваться"
                  : "Войти"}
            </button>
          </form>

          <p className="auth-footer">
            {isRegister ? "Уже есть аккаунт?" : "Ещё нет аккаунта?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
            >
              {isRegister ? "Войти" : "Зарегистрироваться"}
            </button>
          </p>

          <Link to="/" className="auth-back">
            Вернуться на главную
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Login;