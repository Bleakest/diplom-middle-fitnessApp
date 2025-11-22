// pages/auth/Login.tsx
import { Button, Form, Input, Typography, Alert, Spin } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../store/api/auth.api";
import { setCredentials } from "../../store/slices/auth.slice";
import { useAppDispatch } from "../../store/hooks";
import { useState } from "react";

export const Login = () => {
  const { Title } = Typography;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [login, { isLoading, error }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);

  type FieldType = {
    login: string;
    password: string;
  };

  const onFinish = async (values: FieldType) => {
    try {
      setFormError(null);
      
      // Преобразуем логин в email (в моках проверяем по email)
      const loginData = {
        email: values.login,
        password: values.password,
      };

      const result = await login(loginData).unwrap();
      
      // Сохраняем данные авторизации в store
      dispatch(setCredentials({
        user: result.user,
        token: result.token
      }));

      // Перенаправляем в зависимости от роли
      if (result.user.role === 'trainer' || result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/me');
      }

    } catch (err: any) {
      console.error("Login error:", err);
      setFormError(err?.data?.message || err?.message || 'Ошибка входа');
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div className="border border-gray-300 rounded-lg p-6 max-w-md mx-auto">
      <Title level={3}>Вход</Title>

      {/* Показываем ошибки */}
      {formError && (
        <Alert
          message={formError}
          type="error"
          showIcon
          closable
          className="mb-4"
          onClose={() => setFormError(null)}
        />
      )}

      <Form
        name="login"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        disabled={isLoading}
      >
        <Form.Item<FieldType>
          name="login"
          rules={[
            {
              required: true,
              message: "Пожалуйста, введите email или телефон",
            },
          ]}
        >
          <Input 
            placeholder="Введите email или телефон" 
            size="large"
          />
        </Form.Item>

        <Form.Item<FieldType>
          name="password"
          rules={[
            {
              required: true,
              message: "Пожалуйста, введите пароль",
            },
          ]}
        >
          <Input.Password 
            placeholder="Введите пароль" 
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            size="large"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? <Spin size="small" /> : 'Вход'}
          </Button>
        </Form.Item>
      </Form>

      <div className="mt-4 text-center">
        <p>
          Нет аккаунта? <Link to="/signup">Зарегистрируйтесь</Link>
        </p>
        <Link to="/forgot-password">Восстановить пароль</Link>
      </div>

      {/* Демо-аккаунты для тестирования */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <Title level={5} className="!mb-2">Демо-аккаунты:</Title>
        <div className="text-sm space-y-1">
          <div><strong>Клиент:</strong> client@example.com / password123</div>
          <div><strong>Тренер:</strong> trainer@example.com / password123</div>
          <div><strong>Админ:</strong> admin@example.com / password123</div>
        </div>
      </div>
    </div>
  );
};