import { Link } from "react-router-dom";
import Header from "../components/Header";

function About() {
  return (
    <div className="about-page">
      <Header />

      <main>
        <section className="about-hero">
          <p className="about-label">CHRONOS & CO</p>
          <h1>Искусство выбирать время</h1>
          <p>
            Мы объединяем эстетику часового искусства,
            внимание к деталям и стремление к совершенству.
          </p>
        </section>

        <section className="about-intro">
          <div className="about-intro-text">
            <p className="about-section-label">НАША ИСТОРИЯ</p>
            <h2>Время — больше, чем просто цифры на циферблате</h2>

            <p>
              Chronos & Co — интернет-магазин премиальных часов,
              созданный для тех, кто ценит качество, стиль и
              индивидуальность.
            </p>

            <p>
              Мы собрали коллекцию моделей от известных мировых
              часовых брендов, чтобы каждый мог найти часы,
              отражающие его характер и образ жизни.
            </p>
          </div>

          <div className="about-intro-card">
            <span>CHRONOS</span>
            <strong>&</strong>
            <span>CO</span>
            <p>Искусство времени в каждой детали</p>
          </div>
        </section>

        <section className="about-values">
          <p className="about-section-label">НАШИ ПРИНЦИПЫ</p>
          <h2>Что для нас важно</h2>

          <div className="about-values-grid">
            <article className="about-value-card">
              <span>01</span>
              <h3>Качество</h3>
              <p>
                Внимание к деталям, материалам и исполнению
                каждой модели.
              </p>
            </article>

            <article className="about-value-card">
              <span>02</span>
              <h3>Стиль</h3>
              <p>
                Часы, которые дополняют образ и подчёркивают
                индивидуальность.
              </p>
            </article>

            <article className="about-value-card">
              <span>03</span>
              <h3>Выбор</h3>
              <p>
                Разнообразие моделей и брендов для разных
                предпочтений.
              </p>
            </article>
          </div>
        </section>

        <section className="about-quote">
          <p>«Время принадлежит тем, кто умеет его ценить»</p>
          <span>CHRONOS & CO</span>
        </section>

        <section className="about-cta">
          <h2>Найдите часы, которые расскажут вашу историю</h2>
          <p>
            Откройте для себя коллекцию Chronos & Co.
          </p>
          <Link to="/catalog" className="about-catalog-button">
            Перейти в каталог
          </Link>
        </section>
      </main>
    </div>
  );
}

export default About;