# 📦 COMPONENT LIBRARY
## Ant Design Components Usage Guide

**Version:** 1.0.0  
**Last Updated:** May 2, 2026  
**Ant Design Version:** 5.x

---

## 📖 INTRODUCTION

Panduan ini menjelaskan cara menggunakan komponen Ant Design dalam proyek Sekolah Info System. Semua komponen sudah dikonfigurasi dengan tema biru profesional.

---

## 🎯 GENERAL USAGE

### **Import Components**

```jsx
import { Button, Table, Modal, Form, Input } from 'antd';

function MyComponent() {
  return (
    <div>
      <Button type="primary">Click Me</Button>
    </div>
  );
}
```

### **Import Icons**

```jsx
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PlusOutlined 
} from '@ant-design/icons';

<Button icon={<PlusOutlined />} type="primary">
  Add New
</Button>
```

---

## 🔘 BUTTONS

### **Button Types**

```jsx
import { Button } from 'antd';

// Primary button (filled)
<Button type="primary">Primary</Button>

// Default button (outlined)
<Button>Default</Button>

// Dashed button
<Button type="dashed">Dashed</Button>

// Text button (no border)
<Button type="text">Text</Button>

// Link button
<Button type="link">Link</Button>
```

### **Button Sizes**

```jsx
<Button size="small">Small</Button>
<Button size="middle">Middle (default)</Button>
<Button size="large">Large</Button>
```

### **Button States**

```jsx
// Loading state
<Button type="primary" loading>Loading</Button>

// Disabled state
<Button disabled>Disabled</Button>

// Danger button
<Button danger>Danger</Button>
<Button type="primary" danger>Primary Danger</Button>
```

### **Button with Icon**

```jsx
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';

<Button type="primary" icon={<PlusOutlined />}>
  Add New
</Button>

<Button icon={<DownloadOutlined />}>
  Download
</Button>

// Icon only
<Button type="primary" icon={<PlusOutlined />} />
```

### **Button Group**

```jsx
import { Button, Space } from 'antd';

<Space>
  <Button>Cancel</Button>
  <Button type="primary">Submit</Button>
</Space>
```

---

## 📝 FORMS

### **Basic Form**

```jsx
import { Form, Input, Button } from 'antd';

function MyForm() {
  const [form] = Form.useForm();
  
  const onFinish = (values) => {
    console.log('Form values:', values);
  };
  
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please input name!' }]}
      >
        <Input placeholder="Enter name" />
      </Form.Item>
      
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Please input email!' },
          { type: 'email', message: 'Invalid email!' }
        ]}
      >
        <Input placeholder="Enter email" />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
```

### **Form Layouts**

```jsx
// Vertical layout (default)
<Form layout="vertical">

// Horizontal layout
<Form layout="horizontal">

// Inline layout
<Form layout="inline">
```

### **Form Validation**

```jsx
<Form.Item
  label="Password"
  name="password"
  rules={[
    { required: true, message: 'Required!' },
    { min: 8, message: 'Min 8 characters!' },
    { pattern: /[A-Z]/, message: 'Must contain uppercase!' }
  ]}
>
  <Input.Password />
</Form.Item>
```

---

## 📥 INPUTS

### **Text Input**

```jsx
import { Input } from 'antd';

<Input placeholder="Enter text" />

// With prefix/suffix
<Input 
  prefix={<UserOutlined />}
  suffix="@example.com"
  placeholder="Username"
/>

// Disabled
<Input disabled value="Disabled input" />

// With max length
<Input maxLength={10} showCount />
```

### **Password Input**

```jsx
<Input.Password placeholder="Enter password" />
```

### **Text Area**

```jsx
<Input.TextArea 
  rows={4} 
  placeholder="Enter description"
  maxLength={500}
  showCount
/>
```

### **Number Input**

```jsx
import { InputNumber } from 'antd';

<InputNumber 
  min={0} 
  max={100} 
  defaultValue={0}
  placeholder="Enter number"
/>
```

### **Search Input**

```jsx
import { Input } from 'antd';
const { Search } = Input;

<Search 
  placeholder="Search..." 
  onSearch={(value) => console.log(value)}
  enterButton
/>
```

---

## 📋 SELECT

### **Basic Select**

```jsx
import { Select } from 'antd';

<Select
  placeholder="Select option"
  style={{ width: 200 }}
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ]}
/>
```

### **Multiple Select**

```jsx
<Select
  mode="multiple"
  placeholder="Select multiple"
  style={{ width: '100%' }}
  options={options}
/>
```

### **Select with Search**

```jsx
<Select
  showSearch
  placeholder="Search to select"
  optionFilterProp="label"
  options={options}
/>
```

---

## 📅 DATE PICKER

```jsx
import { DatePicker } from 'antd';

// Single date
<DatePicker placeholder="Select date" />

// Date range
<DatePicker.RangePicker />

// With time
<DatePicker showTime placeholder="Select date and time" />
```

---

## 📊 TABLE

### **Basic Table**

```jsx
import { Table } from 'antd';

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space>
        <Button type="link" size="small">Edit</Button>
        <Button type="link" danger size="small">Delete</Button>
      </Space>
    ),
  },
];

const data = [
  { key: '1', name: 'John', age: 32, address: 'New York' },
  { key: '2', name: 'Jane', age: 28, address: 'London' },
];

<Table columns={columns} dataSource={data} />
```

### **Table with Pagination**

```jsx
<Table 
  columns={columns} 
  dataSource={data}
  pagination={{
    pageSize: 10,
    total: 100,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} items`,
  }}
/>
```

### **Table with Sorting**

```jsx
const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: 'Age',
    dataIndex: 'age',
    sorter: (a, b) => a.age - b.age,
  },
];
```

### **Table with Filters**

```jsx
const columns = [
  {
    title: 'Status',
    dataIndex: 'status',
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Inactive', value: 'inactive' },
    ],
    onFilter: (value, record) => record.status === value,
  },
];
```

---

## 🎴 CARD

```jsx
import { Card } from 'antd';

// Basic card
<Card title="Card Title">
  Card content
</Card>

// Card with extra actions
<Card 
  title="Card Title"
  extra={<Button type="link">More</Button>}
>
  Card content
</Card>

// Bordered card
<Card bordered={false}>
  No border card
</Card>

// Loading card
<Card loading>
  Loading...
</Card>
```

---

## 🪟 MODAL

### **Basic Modal**

```jsx
import { Modal, Button } from 'antd';
import { useState } from 'react';

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      
      <Modal
        title="Modal Title"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <p>Modal content here</p>
      </Modal>
    </>
  );
}
```

### **Confirm Modal**

```jsx
import { Modal } from 'antd';

const showConfirm = () => {
  Modal.confirm({
    title: 'Are you sure?',
    content: 'This action cannot be undone.',
    onOk() {
      console.log('OK');
    },
    onCancel() {
      console.log('Cancel');
    },
  });
};

<Button onClick={showConfirm}>Delete</Button>
```

---

## 🎨 MESSAGE & NOTIFICATION

### **Message**

```jsx
import { message, Button } from 'antd';

const showMessage = () => {
  message.success('Success message');
  message.error('Error message');
  message.warning('Warning message');
  message.info('Info message');
  message.loading('Loading...', 2.5);
};

<Button onClick={showMessage}>Show Message</Button>
```

### **Notification**

```jsx
import { notification, Button } from 'antd';

const showNotification = () => {
  notification.success({
    message: 'Success',
    description: 'This is a success notification.',
    placement: 'topRight',
  });
};

<Button onClick={showNotification}>Show Notification</Button>
```

---

## 🏷️ TAG & BADGE

### **Tag**

```jsx
import { Tag } from 'antd';

<Tag>Default</Tag>
<Tag color="success">Success</Tag>
<Tag color="processing">Processing</Tag>
<Tag color="error">Error</Tag>
<Tag color="warning">Warning</Tag>
<Tag color="blue">Blue</Tag>
```

### **Badge**

```jsx
import { Badge, Avatar } from 'antd';

<Badge count={5}>
  <Avatar shape="square" size="large" />
</Badge>

<Badge dot>
  <Avatar shape="square" size="large" />
</Badge>

<Badge status="success" text="Success" />
<Badge status="error" text="Error" />
<Badge status="processing" text="Processing" />
```

---

## 🔔 ALERT

```jsx
import { Alert } from 'antd';

<Alert message="Success" type="success" />
<Alert message="Info" type="info" />
<Alert message="Warning" type="warning" />
<Alert message="Error" type="error" />

// With description
<Alert
  message="Success Title"
  description="Detailed success message."
  type="success"
  showIcon
/>

// Closable
<Alert
  message="Warning"
  type="warning"
  closable
  onClose={() => console.log('Closed')}
/>
```

---

## 📄 PAGINATION

```jsx
import { Pagination } from 'antd';

<Pagination 
  current={1}
  total={100}
  pageSize={10}
  onChange={(page, pageSize) => {
    console.log(page, pageSize);
  }}
  showSizeChanger
  showTotal={(total) => `Total ${total} items`}
/>
```

---

## 🎛️ TABS

```jsx
import { Tabs } from 'antd';

const items = [
  {
    key: '1',
    label: 'Tab 1',
    children: 'Content of Tab 1',
  },
  {
    key: '2',
    label: 'Tab 2',
    children: 'Content of Tab 2',
  },
  {
    key: '3',
    label: 'Tab 3',
    children: 'Content of Tab 3',
  },
];

<Tabs defaultActiveKey="1" items={items} />
```

---

## 🗂️ MENU

```jsx
import { Menu } from 'antd';
import { HomeOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

const items = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: 'Home',
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: 'Users',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
];

<Menu
  mode="inline"
  defaultSelectedKeys={['home']}
  items={items}
  onClick={(e) => console.log('clicked', e.key)}
/>
```

---

## 🔄 SPIN (Loading)

```jsx
import { Spin } from 'antd';

// Basic spinner
<Spin />

// With text
<Spin tip="Loading...">
  <div>Content</div>
</Spin>

// Full page loading
<Spin spinning={loading} fullscreen />
```

---

## 📐 LAYOUT

```jsx
import { Layout } from 'antd';
const { Header, Sider, Content, Footer } = Layout;

<Layout style={{ minHeight: '100vh' }}>
  <Sider>Sidebar</Sider>
  <Layout>
    <Header>Header</Header>
    <Content>Content</Content>
    <Footer>Footer</Footer>
  </Layout>
</Layout>
```

---

## 🎯 SPACE

```jsx
import { Space, Button } from 'antd';

// Horizontal spacing
<Space>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
  <Button>Button 3</Button>
</Space>

// Vertical spacing
<Space direction="vertical" style={{ width: '100%' }}>
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</Space>

// Custom size
<Space size="large">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Space>
```

---

## 📏 DIVIDER

```jsx
import { Divider } from 'antd';

// Horizontal divider
<Divider />

// With text
<Divider>Text</Divider>

// Vertical divider
<Divider type="vertical" />
```

---

## 🎨 CUSTOMIZATION

### **Custom Styles**

```jsx
// Using className
<Button className="my-custom-button">
  Custom Button
</Button>

// Using style prop
<Button style={{ borderRadius: '20px' }}>
  Rounded Button
</Button>
```

### **Custom Theme (Already Configured)**

Theme sudah dikonfigurasi di `src/config/theme.js` dengan warna biru profesional.

---

## 📚 RESOURCES

- [Ant Design Documentation](https://ant.design/components/overview/)
- [Ant Design Icons](https://ant.design/components/icon/)
- [Ant Design Pro Components](https://procomponents.ant.design/)

---

## 💡 TIPS

1. **Always use Form.Item** untuk form inputs agar validation bekerja
2. **Use Space component** untuk spacing antar elemen
3. **Use message/notification** untuk feedback, bukan alert()
4. **Use Modal.confirm** untuk konfirmasi destructive actions
5. **Always provide key prop** untuk list items
6. **Use showTotal** di pagination untuk UX yang lebih baik
7. **Use loading state** untuk async operations
8. **Use disabled state** untuk prevent double submission

---

**Maintained by:** Sekolah Info System Team  
**Last Updated:** May 2, 2026
