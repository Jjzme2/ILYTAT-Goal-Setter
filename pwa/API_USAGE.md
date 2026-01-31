# ILYTAT Goal API Usage

The Goal Setter API allows external applications (CLI, other apps) to manage goals.

## Base URL
`/api/goals`
'GET /api/goals?date=YYYY-MM-DD'
'POST /api/goals' (with body)
'DELETE /api/goals?date=YYYY-MM-DD' (with body)
'PUT /api/goals?date=YYYY-MM-DD' (with body)


## Authentication
Requires a valid Firebase ID Token in the `Authorization` header:
`Authorization: Bearer <firebase_id_token>`

## Shared Types
Types are available in the `@ilytat/common` package.
```typescript
import { Goal, GoalOperation } from '@ilytat/common';
```

## Operations

The API supports `POST` requests with a `GoalOperation` payload.

### 1. Add a Goal
Use `operation: 'add'` to append a new goal to a timeframe.

```json
{
  "operation": "add",
  "timeframe": "daily", // or 'weekly', 'monthly', 'quarterly', 'yearly'
  "date": "2024-01-30", // Optional, defaults to today
  "goal": {
    "text": "Complete API Documentation",
    "priority": "high", // 'low' | 'medium' | 'high'
    "status": "todo",
    "completed": false
  }
}
```

### 2. Update a Goal
Use `operation: 'update'` to modify an existing goal. Requires `goal.id`.

```json
{
  "operation": "update",
  "timeframe": "daily",
  "goal": {
    "id": "uuid-here",
    "completed": true,
    "status": "completed"
  }
}
```

### 3. Delete a Goal
Use `operation: 'delete'` to remove a goal. Requires `goal.id`.

```json
{
  "operation": "delete",
  "timeframe": "daily",
  "goal": {
    "id": "uuid-here"
  }
}
```

### 4. Set Goals (Legacy/Bulk Replace)
Use `operation: 'set'` (or omit operation) to replace the entire goal list for a timeframe.

```json
{
  "operation": "set",
  "timeframe": "daily",
  "goals": [ ... ]
}
```

## Retrieve Goals
`GET /api/goals?date=YYYY-MM-DD`
Returns all goals for all timeframes for the specified date (or today).
