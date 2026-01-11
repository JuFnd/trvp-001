# Домашнее задание по курсу «Технологии разработки веб-приложений»
**Вариант: ТРВП-001**

---

## Описание проекта
Разработка клиент-серверного приложения для управления распределением заявок на подключение интернета между мастерами интернет-провайдера. Приложение реализует CRUD-операции и соответствует следующим техническим требованиям:

## Запуск приложения
```bash
docker-compose -f 'docker-compose.yaml' up -d --build
```
Сервер будет доступен по адресу:
```
http://localhost:1000
```
Скринкаст:
```
https://drive.google.com/file/d/1GhtBXnFEVZLXxWjSAQWBJUhRte9qrM1J
```

### Технические требования
- **Клиентская часть**: HTML, CSS, JavaScript (разрешено использовать любые библиотеки/фреймворки).
- **Серверная часть**: JavaScript/TypeScript, Node.js (разрешено использовать любые библиотеки/фреймворки).
- **API**: REST-like API для взаимодействия между клиентом и сервером.
- **База данных**: Любая СУБД, доступная из JavaScript-кода.

---

## Функциональные требования

### Сущности
1. **Мастер**:
   - ФИО (строка, редактируемый атрибут)
   - ID (строка, нередактируемый атрибут)
   - Список заявок (с возможностью добавления, удаления и перераспределения)

2. **Заявка**:
   - Адрес (строка)
   - Сложность (выбор из списка условных единиц)
   - ID (строка, нередактируемый атрибут)

### Логика
- Каждый мастер может выполнить заявки с суммарной сложностью не более **N** (задается разработчиком).
- При превышении лимита сложности выводится уведомление о невозможности назначения заявки.

---

## API Документация

### 1. Проверка доступности сервера
**Метод:** `GET`
**Эндпоинт:** `/api/v1/ping`
**Описание:** Проверка доступности сервера.
**Ответ:**
```json
{
  "status": 200,
  "message": "Pong!"
}
```

---

### 2. Получение списка мастеров
**Метод:** `GET`
**Эндпоинт:** `/api/v1/technicians`
**Описание:** Возвращает список всех мастеров.
**Ответ:**
```json
{
  "status": 200,
  "data": [
    {
      "id": "string",
      "fullName": "string"
    }
  ],
  "message": "Technicians retrieved successfully"
}
```

---

### 3. Создание мастера
**Метод:** `POST`
**Эндпоинт:** `/api/v1/technicians`
**Тело запроса:**
```json
{
  "fullName": "string"
}
```
**Ответ:**
```json
{
  "status": 201,
  "data": {
    "id": "string",
    "fullName": "string"
  },
  "message": "Technician created successfully"
}
```

---

### 4. Обновление информации о мастере
**Метод:** `PUT`
**Эндпоинт:** `/api/v1/technicians/:technicianId`
**Тело запроса:**
```json
{
  "fullName": "string"
}
```
**Ответ:**
```json
{
  "status": 200,
  "data": {
    "id": "string",
    "fullName": "string"
  },
  "message": "Technician updated successfully"
}
```

---

### 5. Удаление мастера
**Метод:** `DELETE`
**Эндпоинт:** `/api/v1/technicians/:technicianId`
**Ответ:**
```json
{
  "status": 200,
  "message": "Technician deleted successfully"
}
```

---

### 6. Получение заявок мастера
**Метод:** `GET`
**Эндпоинт:** `/api/v1/technicians/:technicianId/tickets`
**Ответ:**
```json
{
  "status": 200,
  "data": [
    {
      "id": "string",
      "address": "string",
      "complexityLevelId": "string"
    }
  ],
  "message": "Tickets retrieved successfully"
}
```

---

### 7. Добавление заявки мастеру
**Метод:** `POST`
**Эндпоинт:** `/api/v1/technicians/:technicianId/tickets`
**Тело запроса:**
```json
{
  "address": "string",
  "complexityLevelId": "string"
}
```
**Ответ:**
```json
{
  "status": 201,
  "data": {
    "id": "string",
    "address": "string",
    "complexityLevelId": "string"
  },
  "message": "Ticket added successfully"
}
```

---

### 8. Удаление заявки
**Метод:** `DELETE`
**Эндпоинт:** `/api/v1/tickets/:ticketId`
**Ответ:**
```json
{
  "status": 200,
  "message": "Ticket removed successfully"
}
```

---

### 9. Перераспределение заявки
**Метод:** `POST`
**Эндпоинт:** `/api/v1/tickets/:ticketId/move`
**Тело запроса:**
```json
{
  "targetTechnicianId": "string"
}
```
**Ответ:**
```json
{
  "status": 200,
  "message": "Ticket moved successfully"
}
```

---

### 10. Получение уровней сложности
**Метод:** `GET`
**Эндпоинт:** `/api/v1/complexity-levels`
**Ответ:**
```json
{
  "status": 200,
  "data": [
    {
      "id": "string",
      "value": "number"
    }
  ],
  "message": "Complexity levels retrieved"
}
```
