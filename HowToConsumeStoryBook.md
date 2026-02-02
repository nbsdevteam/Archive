# How to Use NBS Component Library in Your React Project

This guide is for developers and automation (e.g. agents) integrating the NBS Component Library into a React application. Follow the steps below to install, import styles, and use components correctly.

---

## In this guide

1. **Installation** – Install the package and import styles once.
2. **Quick reference** – Which components use props only vs. optional `config`.
3. **Component examples** – Copy-paste examples for each component.
4. **Glass effect, Card, Sidebar** – Glass options and Sidebar/Card usage.
5. **Config-driven components** – When and how to use the `config` prop.
6. **TypeScript, styling, troubleshooting** – Types, dark mode, and common issues.

---

## Quick reference: how components are used

| Component | How to use | Notes |
|-----------|------------|--------|
| **Sidebar** | **Props only.** Pass `items`, `activeHref`, `title`, `glassEffect`, `width`. | No `config` prop. Each item is a `SidebarItem` with `name`, `href`, `icon`, `onClick`. |
| **Card** | **Either props or `config`.** Use `title`, `children`, `footer`, etc., **or** a single `config` object. | See [Card component](#card-component) and [Config-driven Card](#card-with-config). |
| **Button, Badge, Alert, Modal, Input, Select, Checkbox, Radio, Textarea, Switch** | **Props only.** | Standard React props; no `config`. |
| **DataTable** | **Either props or `config`.** Columns/data as props or via `config`. | Same pattern as Card. |
| **Dialog, Tabs, Accordion, NavigationMenu, Breadcrumb, DropdownMenu, Form, Combobox, CommandPalette** | **Config-driven.** Pass a `config` object. | See [Config-driven components](#config-driven-components). |

**Important:** The `config` prop is **optional** everywhere. You can use components the **normal way** with direct props (e.g. `title`, `children`, `items`) and never pass `config` if you prefer. Use `config` only when you want a single-object API for dynamic or structured content. **Sidebar** does not support `config`—always use `items` and other props.

---

## Installation

### Step 1: Install the Library

**Option A: Install latest version (recommended)**

Always get the newest release. Run `npm install` later to pick up new versions.

```bash
npm install github:syednaqvi98nibras/StoryBook#latest
```

**Option B: Pin to a specific version (e.g. for production)**

Use a version tag so installs are predictable. Replace `v1.1.1` with the version you need.

```bash
npm install github:syednaqvi98nibras/StoryBook#v1.1.1
```

**Or add the dependency in `package.json`**

```json
{
  "dependencies": {
    "@nbs/component-library": "github:syednaqvi98nibras/StoryBook#latest"
  }
}
```

For a specific version:

```json
{
  "dependencies": {
    "@nbs/component-library": "github:syednaqvi98nibras/StoryBook#v1.1.1"
  }
}
```

Then run `npm install`.

**Updating later**

- If you used **Option A** (`#latest`): run `npm install` (or `npm update @nbs/component-library`) to get the latest release.
- If you used **Option B** (pinned): change the version in `package.json` to a newer tag (e.g. `#v1.2.0`) and run `npm install`.

Either way you get the `@nbs/component-library` package and its dependencies.

### Step 2: Import Styles

In your main entry file (usually `src/main.tsx` or `src/index.tsx`), import the library styles:

```typescript
import '@nbs/component-library/dist/styles.css';
```

**Important:** Import this file once before using any components. The library uses **framework-agnostic native CSS** (design tokens + scoped CSS modules). It does **not** depend on Bootstrap or Tailwind, so you can use it in Bootstrap apps, Tailwind apps, or apps with no CSS framework without losing styling.

## Basic Usage

### Import Components

```typescript
import {
  Button,
  Card,
  Badge,
  Alert,
  Modal,
  DataTable,
  Input,
  Select,
  Checkbox,
  Textarea,
  Radio,
  Switch,
  GlassEffectWrapper,
  Sidebar,
} from '@nbs/component-library';
```

You can import individual components or multiple at once:

```typescript
// Import specific components
import { Button, Card } from '@nbs/component-library';

// Import with TypeScript types
import { Button, type ButtonProps } from '@nbs/component-library';
import { Sidebar, type SidebarItem } from '@nbs/component-library';
```

**Glass effects:** Card supports optional glass via `glassEffect`, `glassVariant`, and `glassRandomHue`. Sidebar supports glass-style hover on nav items via `glassEffect`. See [Glass effect, Card, and Sidebar](#glass-effect-card-and-sidebar) for details.

**Important:** Import the library CSS **once** in your app entry (see [Installation](#installation)) before using any component. Without it, components may not look correct.

## Component Examples

### Button Component

```typescript
import { Button } from '@nbs/component-library';

function MyComponent() {
  return (
    <div>
      {/* Primary button */}
      <Button variant="primary" onClick={() => console.log('Clicked!')}>
        Primary Button
      </Button>

      {/* Secondary button */}
      <Button variant="secondary">Secondary</Button>

      {/* Success button with rounded style */}
      <Button variant="success" rounded>
        Success
      </Button>

      {/* Disabled button */}
      <Button variant="primary" disabled>
        Disabled
      </Button>

      {/* Loading button */}
      <Button variant="primary" loading>
        Loading...
      </Button>

      {/* Full width button */}
      <Button variant="primary" fullWidth>
        Full Width
      </Button>

      {/* Button as link */}
      <Button variant="primary" href="https://example.com" target="_blank">
        Open Link
      </Button>

      {/* Different sizes */}
      <Button variant="primary" size="small">Small</Button>
      <Button variant="primary" size="medium">Medium</Button>
      <Button variant="primary" size="large">Large</Button>
    </div>
  );
}
```

**Available Variants:**
- `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`
- `outline-primary`, `outline-secondary`, `outline-success`, `outline-danger`, `outline-warning`, `outline-info`, `outline-light`, `outline-dark`

**Available Sizes:**
- `small`, `medium`, `large`

### Card Component

```typescript
import { Card } from '@nbs/component-library';

function MyComponent() {
  return (
    <div>
      {/* Basic card */}
      <Card title="Card Title">
        <p>Card content goes here</p>
      </Card>

      {/* Card with subtitle */}
      <Card title="Card Title" subtitle="Card Subtitle">
        <p>Content with subtitle</p>
      </Card>

      {/* Card with image */}
      <Card
        imageSrc="https://via.placeholder.com/400x200"
        imageAlt="Card image"
        title="Card with Image"
      >
        <p>This card has an image at the top</p>
      </Card>

      {/* Card with header */}
      <Card
        header={<div className="badge bg-primary">Featured</div>}
        title="Special Card"
      >
        <p>Card with custom header</p>
      </Card>

      {/* Card with footer */}
      <Card
        title="Card with Footer"
        footer={
          <div>
            <Button variant="primary" size="small">Action</Button>
          </div>
        }
      >
        <p>Card content</p>
      </Card>

      {/* Complete card */}
      <Card
        imageSrc="https://via.placeholder.com/400x200"
        imageAlt="Image"
        header={<div className="badge bg-success">New</div>}
        title="Complete Card"
        subtitle="Subtitle"
        footer={
          <div className="d-flex gap-2">
            <Button variant="primary" size="small">Save</Button>
            <Button variant="secondary" size="small">Cancel</Button>
          </div>
        }
      >
        <p>This is a complete card with all sections</p>
      </Card>

      {/* Card without shadow */}
      <Card title="No Shadow" shadow={false}>
        <p>Card without shadow effect</p>
      </Card>

      {/* Card without border */}
      <Card title="No Border" bordered={false}>
        <p>Card without border</p>
      </Card>

      {/* Card with glass effect (shine or perfume) */}
      <Card glassEffect title="Glass Card" subtitle="Hover for effect">
        <p>Uses built-in glass effect. See "Glass effect, Card, and Sidebar" for glassEffect, glassVariant, and glassRandomHue.</p>
      </Card>
    </div>
  );
}
```

**Card usage:** The examples above use **direct props** (`title`, `children`, `footer`, etc.). Card also accepts an **optional** **`config`** prop—you can use either approach. **Config is not mandatory.** Use direct props for simple cards; use `config` only when you want structured or dynamic content. See [Config-driven components](#config-driven-components) for a Card `config` example.

For **glass effect** options (shine, perfume, random hue), see [Glass effect, Card, and Sidebar](#glass-effect-card-and-sidebar).

### Badge Component

```typescript
import { Badge } from '@nbs/component-library';

function MyComponent() {
  return (
    <div>
      {/* Basic badges */}
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>

      {/* Rounded badge */}
      <Badge variant="primary" rounded>
        Rounded
      </Badge>

      {/* Outline badge */}
      <Badge variant="outline-primary">
        Outline
      </Badge>
    </div>
  );
}
```

### Alert Component

```typescript
import { Alert } from '@nbs/component-library';

function MyComponent() {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div>
      {/* Basic alert */}
      <Alert variant="success">
        This is a success alert!
      </Alert>

      {/* Alert with title */}
      <Alert variant="danger" title="Error">
        Something went wrong
      </Alert>

      {/* Dismissible alert */}
      {showAlert && (
        <Alert
          variant="info"
          title="Information"
          dismissible
          onDismiss={() => setShowAlert(false)}
        >
          This alert can be dismissed
        </Alert>
      )}

      {/* All variants */}
      <Alert variant="primary">Primary alert</Alert>
      <Alert variant="secondary">Secondary alert</Alert>
      <Alert variant="success">Success alert</Alert>
      <Alert variant="danger">Danger alert</Alert>
      <Alert variant="warning">Warning alert</Alert>
      <Alert variant="info">Info alert</Alert>
    </div>
  );
}
```

### Modal Component

```typescript
import { Modal, Button } from '@nbs/component-library';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        size="md"
        centered
      >
        <p>Modal content goes here</p>
        <p>You can put any React content inside the modal.</p>
      </Modal>

      {/* Modal with footer */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => {
              // Handle confirm action
              setIsOpen(false);
            }}>
              Confirm
            </Button>
          </>
        }
      >
        <p>Are you sure you want to proceed?</p>
      </Modal>

      {/* Different sizes */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm" title="Small Modal">
        Small modal content
      </Modal>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg" title="Large Modal">
        Large modal content
      </Modal>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl" title="Extra Large Modal">
        Extra large modal content
      </Modal>

      {/* Static backdrop (can't close by clicking outside) */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Static Backdrop"
        backdrop="static"
      >
        This modal cannot be closed by clicking the backdrop
      </Modal>
    </div>
  );
}
```

### Input Component

```typescript
import { Input } from '@nbs/component-library';
import { useState } from 'react';

function MyComponent() {
  const [value, setValue] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div>
      {/* Basic input */}
      <Input
        type="text"
        placeholder="Enter your name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      {/* Input with label */}
      <Input
        label="Email Address"
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {/* Input with helper text */}
      <Input
        label="Username"
        helperText="Choose a unique username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      {/* Input with error state */}
      <Input
        label="Password"
        type="password"
        errorText="Password must be at least 8 characters"
        isValid={false}
      />

      {/* Input with left icon */}
      <Input
        label="Search"
        leftIcon={<i className="ti ti-search" />}
        placeholder="Search..."
      />

      {/* Input with right icon */}
      <Input
        label="Password"
        type="password"
        rightIcon={<i className="ti ti-eye" />}
      />

      {/* Different sizes */}
      <Input size="small" placeholder="Small input" />
      <Input size="medium" placeholder="Medium input" />
      <Input size="large" placeholder="Large input" />
    </div>
  );
}
```

### Select Component

```typescript
import { Select } from '@nbs/component-library';
import { useState } from 'react';

function MyComponent() {
  const [selected, setSelected] = useState('');
  const [multiSelected, setMultiSelected] = useState([]);

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <div>
      {/* Basic select */}
      <Select
        label="Choose an option"
        options={options}
        value={selected}
        onChange={(value) => setSelected(value)}
        placeholder="Select an option"
      />

      {/* Multiple select */}
      <Select
        label="Choose multiple options"
        options={options}
        multiple
        value={multiSelected}
        onChange={(values) => setMultiSelected(values)}
      />

      {/* Select with validation */}
      <Select
        label="Required Field"
        options={options}
        required
        errorText="This field is required"
        isValid={selected === '' ? false : true}
      />
    </div>
  );
}
```

### Checkbox Component

```typescript
import { Checkbox } from '@nbs/component-library';
import { useState } from 'react';

function MyComponent() {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      {/* Basic checkbox */}
      <Checkbox
        label="I agree to the terms and conditions"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />

      {/* Checkbox with label before */}
      <Checkbox
        label="Enable notifications"
        labelPosition="before"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />

      {/* Different sizes */}
      <Checkbox size="small" label="Small checkbox" />
      <Checkbox size="medium" label="Medium checkbox" />
      <Checkbox size="large" label="Large checkbox" />

      {/* With validation */}
      <Checkbox
        label="Required checkbox"
        required
        errorText="You must accept this"
        isValid={checked}
      />
    </div>
  );
}
```

### Radio Component

```typescript
import { Radio } from '@nbs/component-library';
import { useState } from 'react';

function MyComponent() {
  const [selected, setSelected] = useState('option1');

  return (
    <div>
      {/* Basic radio */}
      <Radio
        label="Option 1"
        name="group1"
        value="option1"
        checked={selected === 'option1'}
        onChange={(e) => setSelected(e.target.value)}
      />

      <Radio
        label="Option 2"
        name="group1"
        value="option2"
        checked={selected === 'option2'}
        onChange={(e) => setSelected(e.target.value)}
      />

      {/* Radio group */}
      <div>
        <h4>Choose a plan:</h4>
        <Radio
          label="Basic Plan"
          name="plan"
          value="basic"
          checked={selected === 'basic'}
          onChange={(e) => setSelected(e.target.value)}
        />
        <Radio
          label="Pro Plan"
          name="plan"
          value="pro"
          checked={selected === 'pro'}
          onChange={(e) => setSelected(e.target.value)}
        />
        <Radio
          label="Enterprise Plan"
          name="plan"
          value="enterprise"
          checked={selected === 'enterprise'}
          onChange={(e) => setSelected(e.target.value)}
        />
      </div>
    </div>
  );
}
```

### Textarea Component

```typescript
import { Textarea } from '@nbs/component-library';
import { useState } from 'react';

function MyComponent() {
  const [value, setValue] = useState('');

  return (
    <div>
      {/* Basic textarea */}
      <Textarea
        label="Message"
        placeholder="Enter your message"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
      />

      {/* Auto-resize textarea */}
      <Textarea
        label="Auto-resize"
        autoResize
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      {/* Textarea with character count */}
      <Textarea
        label="Description"
        maxLength={200}
        showCharCount
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      {/* With validation */}
      <Textarea
        label="Required Field"
        required
        errorText="This field is required"
        isValid={value.length > 0}
      />
    </div>
  );
}
```

### Switch Component

```typescript
import { Switch } from '@nbs/component-library';
import { useState } from 'react';

function MyComponent() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div>
      {/* Basic switch */}
      <Switch
        label="Enable feature"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      />

      {/* Different variants */}
      <Switch variant="primary" label="Primary switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
      <Switch variant="success" label="Success switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
      <Switch variant="danger" label="Danger switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />

      {/* Different sizes */}
      <Switch size="small" label="Small switch" />
      <Switch size="medium" label="Medium switch" />
      <Switch size="large" label="Large switch" />
    </div>
  );
}
```

### DataTable Component

```typescript
import { DataTable } from '@nbs/component-library';

function MyComponent() {
  // Define columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" variant="primary" onClick={() => handleEdit(record)}>
          Edit
        </Button>
      ),
    },
  ];

  // Sample data
  const data = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' },
  ];

  return (
    <div>
      {/* Basic table */}
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
      />

      {/* Table with search */}
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        searchable
        searchPlaceholder="Search users..."
      />

      {/* Table with selection */}
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        selection
        onSelectionChange={(keys, rows) => {
          console.log('Selected:', keys, rows);
        }}
      />

      {/* Table with loading state */}
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        skeletonRows={5}
      />

      {/* Table with custom pagination */}
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />

      {/* Table with row click handler */}
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        onRowClick={(record, index) => {
          console.log('Clicked row:', record, index);
        }}
      />
    </div>
  );
}
```

## Glass effect, Card, and Sidebar

### Card with built-in glass effect

`Card` supports an optional **glass effect** via props. Use a **single import**—no need to use `GlassEffectWrapper` for cards.

- **`glassEffect`** (boolean): Enables the glass effect. When `true`, you can optionally set `glassVariant` and (for perfume) `glassRandomHue`.
- **`glassVariant`** (`'shine'` | `'perfume'`, optional): Defaults to `'shine'` when `glassEffect` is true. Use `'perfume'` for a different hover style.
- **`glassRandomHue`** (boolean, optional): Only valid when `glassVariant === 'perfume'`. Adds a colored tint on hover; the hue changes each time you leave and re-hover.

TypeScript uses a **discriminated union**: you cannot pass `glassVariant` or `glassRandomHue` without `glassEffect={true}`, and `glassRandomHue` is only allowed with `glassVariant="perfume"`.

```typescript
import { Card, Button } from '@nbs/component-library';

function MyComponent() {
  return (
    <div>
      {/* Basic card (no glass) */}
      <Card title="Plain Card">
        <p>Normal card</p>
      </Card>

      {/* Card with glass shine (default) */}
      <Card glassEffect title="Glass Card" subtitle="Shine variant">
        <p>Hover to see the shine effect.</p>
      </Card>

      {/* Card with glass perfume */}
      <Card glassEffect glassVariant="perfume" title="Perfume Glass" subtitle="Different hover style">
        <p>Perfume-style glass effect.</p>
      </Card>

      {/* Card with perfume + random hue (color changes on each re-hover) */}
      <Card
        glassEffect
        glassVariant="perfume"
        glassRandomHue
        title="Colorful Glass"
        subtitle="Re-hover to see new colors"
      >
        <p>Leave and hover again to cycle tint colors.</p>
      </Card>

      {/* Complete card with glass */}
      <Card
        glassEffect
        glassVariant="perfume"
        glassRandomHue
        imageSrc="https://via.placeholder.com/400x200"
        title="Featured"
        subtitle="With glass"
        footer={
          <div className="d-flex gap-2">
            <Button variant="primary" size="small">Action</Button>
            <Button variant="secondary" size="small">Cancel</Button>
          </div>
        }
      >
        <p>Full card with image, footer, and glass.</p>
      </Card>
    </div>
  );
}
```

### GlassEffectWrapper (standalone)

Use `GlassEffectWrapper` when you want a glass effect on **non-Card** elements (e.g. buttons, custom blocks). For `Card`, use the built-in `glassEffect` props instead.

- **`variant`**: `'shine'` | `'perfume'`. Default `'shine'`.
- **`randomHue`**: When `true` and `variant === 'perfume'`, the surface gets a colored tint on hover. Each wrapped element gets a **stable hue** per instance (based on mount order); the hue does not change on re-hover.
- **`asChild`**: Default `true`. Composes with a single child (Radix Slot). Set `asChild={false}` to render a wrapper `div` around children.
- **`glassEffect`**: Optional boolean; when `false`, no glass class is applied.

```typescript
import { GlassEffectWrapper } from '@nbs/component-library';

function MyComponent() {
  return (
    <div>
      {/* Shine on a button */}
      <GlassEffectWrapper variant="shine" asChild>
        <button type="button" className="btn btn-primary">
          Glass button
        </button>
      </GlassEffectWrapper>

      {/* Perfume with random hue (stable hue per item) */}
      <GlassEffectWrapper variant="perfume" randomHue asChild>
        <div className="p-4 rounded border">Hover for tint</div>
      </GlassEffectWrapper>

      {items.map((item) => (
        <GlassEffectWrapper key={item.id} variant="perfume" randomHue asChild>
          <div className="p-3 rounded">{item.name}</div>
        </GlassEffectWrapper>
      ))}
    </div>
  );
}
```

### Sidebar

**Sidebar does not use a `config` prop.** Always pass an array of **items** and the other props below.

- **`items`** (required): Array of `SidebarItem`: `{ name, href, icon, onClick, hoverColor?, activeColor? }`. Icons are from `lucide-react`.
- **`activeHref`**: The `href` of the currently active item (e.g. current route).
- **`title`**: Sidebar title. Default `"Call Center"`.
- **`glassEffect`**: Enables glass-style hover on nav items. Default `true`. Does not enable random hue.
- **`width`**: Width of the sidebar. Default `"256px"`. Can be a number (e.g. `256`) or string.
- **`className`**, **`itemClassName`**: Optional class names.

```typescript
import { Sidebar, type SidebarItem } from '@nbs/component-library';
import { LayoutDashboard, Users, Settings } from 'lucide-react';

const items: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    onClick: (href) => console.log('Navigate:', href),
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    onClick: (href) => console.log('Navigate:', href),
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    onClick: (href) => console.log('Navigate:', href),
  },
];

function MyLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        items={items}
        activeHref="/dashboard"
        title="My App"
        glassEffect
        width={256}
      />
      <main style={{ flex: 1 }}>{/* page content */}</main>
    </div>
  );
}
```

**Example:** Disable glass with `glassEffect={false}`. Always provide `items` and at least `onClick` per item.

## Complete Example: Form with Multiple Components

```typescript
import { useState } from 'react';
import { Button, Card, Input, Select, Checkbox, Textarea, Alert } from '@nbs/component-library';
import '@nbs/component-library/dist/styles.css';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    newsletter: false,
  });
  const [showAlert, setShowAlert] = useState(false);

  const subjectOptions = [
    { value: 'support', label: 'Support' },
    { value: 'sales', label: 'Sales' },
    { value: 'general', label: 'General Inquiry' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <Card title="Contact Us">
        {showAlert && (
          <Alert variant="success" dismissible onDismiss={() => setShowAlert(false)}>
            Form submitted successfully!
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your name"
          />

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
          />

          <Select
            label="Subject"
            required
            options={subjectOptions}
            value={formData.subject}
            onChange={(value) => setFormData({ ...formData, subject: value })}
            placeholder="Select a subject"
          />

          <Textarea
            label="Message"
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Enter your message"
            maxLength={500}
            showCharCount
          />

          <Checkbox
            label="Subscribe to our newsletter"
            checked={formData.newsletter}
            onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Button type="submit" variant="primary">
              Submit
            </Button>
            <Button type="button" variant="secondary" onClick={() => setFormData({
              name: '',
              email: '',
              subject: '',
              message: '',
              newsletter: false,
            })}>
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ContactForm;
```

## TypeScript Support

All components are fully typed. You can import TypeScript types:

```typescript
import { Button, type ButtonProps } from '@nbs/component-library';

// Use types in your code
const buttonProps: ButtonProps = {
  variant: 'primary',
  size: 'medium',
  children: 'Click me',
};
```

## Styling and Customization

### Framework-agnostic usage

The library uses **native CSS** (design tokens + scoped CSS modules). It does not depend on Bootstrap or Tailwind. You can use it in:

- **Bootstrap** apps – components keep their look; no class collisions.
- **Tailwind** apps – same; no framework conflict.
- **No framework** – components are fully self-styled.

Use your app’s own layout utilities (Bootstrap grid, Tailwind flex, or custom CSS) around the components:

```typescript
<div className="d-flex gap-2 mb-3">
  <Button variant="primary">Button 1</Button>
  <Button variant="secondary">Button 2</Button>
</div>

<Card title="Custom Card" className="my-4">
  Content
</Card>
```

### Dark mode

- **System preference:** Components respect `prefers-color-scheme: dark` and switch to dark tokens automatically.
- **App-controlled:** Wrap your app (or a subtree) with `data-nbs-theme="dark"` to force dark mode regardless of system preference:

```typescript
<div data-nbs-theme="dark">
  <Sidebar items={items} title="My App" />
  <main>...</main>
</div>
```

Remove the attribute (or set `data-nbs-theme="light"`) to use light mode.

### Custom Styling

You can add custom CSS classes to components via the `className` prop:

```typescript
<Button variant="primary" className="my-custom-class">
  Custom Button
</Button>

<Card title="Custom Card" className="shadow-lg">
  Content
</Card>
```

## Best Practices

1. **Always import styles first**: Make sure to import `@nbs/component-library/dist/styles.css` before using components.

2. **Use TypeScript types**: Import component types for better type safety:
   ```typescript
   import { Button, type ButtonProps } from '@nbs/component-library';
   ```

3. **Handle form state**: Use React state (`useState`) or form libraries (Formik, React Hook Form) to manage form component values.

4. **Error handling**: Use the `isValid` and `errorText` props for form validation feedback.

5. **Accessibility**: Components include ARIA attributes, but always test with screen readers for your specific use cases.

6. **Performance**: For large lists, consider using the DataTable's virtual scrolling feature (enabled automatically for >100 rows).

## Verification checklist

Use this to confirm the library works in your app (Bootstrap, Tailwind, or no framework):

1. **Styles:** In your main entry, you have `import '@nbs/component-library/dist/styles.css';` (or `import '@nbs/component-library/styles.css';`).
2. **Light mode:** Button, Card, Sidebar, Modal, Input, Alert render with correct colors and layout.
3. **Dark mode (system):** With OS set to dark mode, components use dark tokens (or wrap with `data-nbs-theme="dark"` and confirm the same).
4. **No framework:** In an app with no Bootstrap/Tailwind, all components still look correct.
5. **With Bootstrap:** In a Bootstrap app, library components are unchanged; no missing or overridden styles.
6. **With Tailwind:** In a Tailwind app, library components are unchanged.

## Troubleshooting

### Components not styling correctly

- Ensure you've imported the styles: `import '@nbs/component-library/dist/styles.css';`
- Check that the import is in your main entry file (before component imports)
- The library is framework-agnostic; it does not bundle Bootstrap or Tailwind

### TypeScript errors

- Make sure you have `@types/react` and `@types/react-dom` installed
- Check that your TypeScript version is compatible (5.9+)

### Import errors

- Verify the package name: `@nbs/component-library`
- Check that the library was installed correctly: `npm ls @nbs/component-library`
- Ensure you're using the correct import path: `@nbs/component-library/dist/styles.css`

## Need Help?

- View components in Storybook: Clone the repo and run `npm run storybook`
- Check component props: All components have JSDoc comments with prop descriptions
- Review examples: See the Storybook stories for each component

## Next Steps

1. Install the library in your project
2. Import styles in your main entry file
3. Start using components in your React components
4. Customize as needed with props and CSS classes

## Config-Driven Components

Some components accept an **optional** **`config`** prop so you can pass a single object instead of many props. **`config` is never mandatory**—you can always use components the normal way with direct props. Use `config` when it fits your use case (e.g. dynamic or data-driven UIs).

### Who supports `config`?

| Component | Usage |
|-----------|--------|
| **Card**, **DataTable** | **Dual API.** Use direct props (e.g. `title`, `children`) **or** a `config` object. Prefer props for simple cases; use `config` for structured/stateful content. |
| **Dialog**, **Tabs**, **Accordion**, **NavigationMenu**, **Breadcrumb**, **DropdownMenu**, **Form**, **Combobox**, **CommandPalette** | **Optional `config`.** You can pass a `config` object, or use the component’s normal props when available. See each component’s types for the full API. |

**Sidebar** does **not** support `config`; always use `items` and other props. For all other components above, **config is optional**—use direct props for normal usage whenever the component supports them.

### Tabs with config

```tsx
import { Tabs } from '@nbs/component-library';

<Tabs
  config={{
    tabs: [
      { id: 'overview', label: 'Overview', content: <div>Overview</div> },
      { id: 'settings', label: 'Settings', content: <div>Settings</div> },
    ],
    defaultTab: 'overview',
    variant: 'underline',
  }}
/>;
```

### Card with config

Card can be used with **direct props** (see [Card component](#card-component)) or with a **`config`** object. Use `config` when you want structured header/footer actions, loading state, or collapsible content.

```tsx
import { Card, Button } from '@nbs/component-library';

<Card
  config={{
    header: { title: 'Dashboard', subtitle: 'Overview' },
    content: <p>Main content here.</p>,
    footer: {
      actions: {
        primary: { label: 'Save', onClick: () => {} },
        secondary: { label: 'Cancel', onClick: () => {} },
      },
      alignment: 'right',
    },
    variant: 'elevated',
    size: 'md',
  }}
/>;
```

When you pass `config`, Card uses it for structure (header, content, footer) and ignores legacy props like `title`/`children`/`footer` for that purpose. Top-level props such as `glassEffect`, `glassVariant`, and `glassRandomHue` can be used alongside `config`. See the `CardProps` and `CardConfig` types in the package for the full API.

---

## Implementation checklist (for developers and agents)

Use this to implement the library correctly:

1. **Install:** `npm install github:syednaqvi98nibras/StoryBook#latest` (or pin to a tag like `#v1.1.1`).
2. **Styles:** In the app entry file (e.g. `main.tsx`), add: `import '@nbs/component-library/dist/styles.css';` (once, before any component imports).
3. **Sidebar:** Use props only. Pass `items` (array of `{ name, href, icon, onClick }`), `activeHref`, `title`, `glassEffect`, `width`. Do not pass `config`.
4. **Card:** Use either direct props (`title`, `children`, `footer`, …) or a `config` object, not both for the same structure.
5. **Other components:** Use props as shown in this guide. For Dialog, Tabs, Accordion, etc., the `config` prop is **optional**—use normal props when you prefer; use `config` when you want the single-object API.
6. **Types:** Import types where needed, e.g. `import { Sidebar, type SidebarItem } from '@nbs/component-library';`.

Happy coding!
