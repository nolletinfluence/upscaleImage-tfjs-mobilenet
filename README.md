> Сделано с ❤️ Азимом на хакатоне в 2025 году

# AI-Powered Image Upscaler

> Client-side апскейлинг изображений с использованием TensorFlow.js (MobileNet), реализован на стеке React + Vite + TypeScript + TailwindCSS.

## 🚀 Возможности

- Увеличение разрешения изображений прямо в браузере
- Используется MobileNet модель TensorFlow.js
- Сравнение "до/после" с draggable-ползунком
- Ленивый рендеринг и оптимизация производительности
- Мониторинг производительности через custom-компонент
- Современный и отзывчивый интерфейс

## 🧠 Технологии

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [MobileNet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet)
- [Lucide Icons](https://lucide.dev/)

## 📦 Установка

```bash
# Клонируем репозиторий
git clone https://github.com/nolletinfluence/upscaleImage-tfjs-mobilenet
cd upscaleImage-tfjs-mobilenet

# Устанавливаем зависимости
npm install

# Запускаем в dev-режиме
npm run dev
```

## 🗂 Структура проекта

```bash
.
├── public/                 # Статика (при желании можно положить пример изображений)
├── src/
│   ├── components/         # DemoGallery, PerformanceMonitor, UpscalableImage и т.д.
│   ├── context/            # UpscalerContext
│   ├── hooks/              # useUpscaler, useIntersectionObserver
│   ├── utils/              # GlobalUpscaler
│   ├── App.tsx            # Главный компонент приложения
│   ├── main.tsx           # Точка входа
│   └── index.css          # Tailwind стили
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── README.md              # 📄 Это ты читаешь сейчас
```

## 📸 Использование

### 1. Загрузка и апскейлинг изображения

В компоненте `UpscalableImage` реализован lazy-upscale. Когда изображение попадает в зону видимости, оно автоматически апскейлится:

```tsx
<UpscalableImage
  src="/images/sample.jpg"
  alt="Sample image"
  width={512}
  height={512}
  showComparison={true}
/>
```

### 2. Галерея

Компонент `DemoGallery` автоматически рендерит изображения из набора и применяет к ним `UpscalableImage`.

### 3. Производительность

Компонент `PerformanceMonitor` показывает fps, загрузку CPU и время апскейлинга (можно кастомизировать).

## 🔗 Ссылки

- [TensorFlow.js Docs](https://js.tensorflow.org/)
- [Vite Docs](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## 🤝 Контрибьютинг

Pull Request'ы приветствуются. Для серьёзных изменений — создай issue.

## 📄 Лицензия

Этот проект использует MIT License. Свободен для использования, изменения и распространения.

---