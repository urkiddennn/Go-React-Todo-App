import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Checkbox,
  List,
  Typography,
  message, // For toast-like notifications
  Flex, // For layout similar to HStack/VStack
  Card, // A general container component
} from "antd";
import { DeleteOutlined } from "@ant-design/icons"; // Ant Design icons

const { Title, Text } = Typography;

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodoBody, setNewTodoBody] = useState("");

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error("Error fetching todos:", error);
      message.error(`Failed to fetch todos: ${error.message}`); // AntD message for error
    }
  };

  const createTodo = async () => {
    if (!newTodoBody.trim()) {
      message.warning("Todo body cannot be empty!"); // AntD message for warning
      return;
    }
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: newTodoBody }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }
      setNewTodoBody("");
      fetchTodos(); // Refresh the list of todos
      message.success("Todo created successfully!"); // AntD message for success
    } catch (error) {
      console.error("Error creating todo:", error);
      message.error(`Failed to create todo: ${error.message}`);
    }
  };

  const toggleTodoCompleted = async (id) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchTodos(); // Refresh the list of todos
      message.info("Todo status updated!"); // AntD message for info
    } catch (error) {
      console.error("Error updating todo:", error);
      message.error(`Failed to update todo: ${error.message}`);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchTodos(); // Refresh the list of todos
      message.success("Todo deleted successfully!");
    } catch (error) {
      console.error("Error deleting todo:", error);
      message.error(`Failed to delete todo: ${error.message}`);
    }
  };

  return (
    <Flex
      justify="center"
      align="flex-start"
      style={{ minHeight: "100vh", padding: "20px" }}
    >
      <Card
        title={
          <Title level={2} style={{ textAlign: "center", marginBottom: "0" }}>
            Go-Fiber AntD Todo App
          </Title>
        }
        style={{ width: 600, maxWidth: "95%" }}
        bodyStyle={{ padding: "24px" }}
      >
        <Flex gap="middle" style={{ marginBottom: "20px" }}>
          <Input
            placeholder="Add new todo"
            value={newTodoBody}
            onChange={(e) => setNewTodoBody(e.target.value)}
            onPressEnter={createTodo} // AntD input has onPressEnter
          />
          <Button type="primary" onClick={createTodo}>
            Add Todo
          </Button>
        </Flex>

        <List
          bordered
          locale={{
            emptyText: (
              <Text type="secondary">No todos yet. Add one above!</Text>
            ),
          }}
          dataSource={todos}
          renderItem={(todo) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteTodo(todo._id)}
                  key="delete"
                />,
              ]}
              style={{
                backgroundColor: todo.completed ? "#f0f0f0" : "#fff",
                padding: "12px 16px",
              }}
            >
              <Checkbox
                checked={todo.completed}
                onChange={() => toggleTodoCompleted(todo._id)}
              >
                <Text delete={todo.completed} style={{ fontSize: "16px" }}>
                  {todo.body}
                </Text>
              </Checkbox>
            </List.Item>
          )}
        />
      </Card>
    </Flex>
  );
}

export default App;
