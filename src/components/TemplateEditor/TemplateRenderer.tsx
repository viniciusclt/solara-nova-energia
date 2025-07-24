import React from 'react';
import { TemplateComponent } from './types';

interface TemplateRendererProps {
  component: TemplateComponent;
  isSelected?: boolean;
  isPreview?: boolean;
  onSelect?: (id: string) => void;
  onDoubleClick?: (id: string) => void;
  scale?: number;
}

export function TemplateRenderer({
  component,
  isSelected = false,
  isPreview = false,
  onSelect,
  onDoubleClick,
  scale = 1
}: TemplateRendererProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview && onSelect) {
      e.stopPropagation();
      onSelect(component.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isPreview && onDoubleClick) {
      e.stopPropagation();
      onDoubleClick(component.id);
    }
  };

  const getCommonStyles = (): React.CSSProperties => ({
    position: 'absolute',
    left: component.position.x * scale,
    top: component.position.y * scale,
    width: component.size.width * scale,
    height: component.size.height * scale,
    zIndex: component.zIndex,
    backgroundColor: component.properties.backgroundColor,
    color: component.properties.color,
    fontSize: (component.properties.fontSize || 14) * scale,
    fontWeight: component.properties.fontWeight,
    textAlign: component.properties.textAlign as any,
    padding: component.properties.padding ? (
      `${(component.properties.padding.top || 0) * scale}px ` +
      `${(component.properties.padding.right || 0) * scale}px ` +
      `${(component.properties.padding.bottom || 0) * scale}px ` +
      `${(component.properties.padding.left || 0) * scale}px`
    ) : undefined,
    border: component.properties.borderWidth ? (
      `${component.properties.borderWidth * scale}px ` +
      `${component.properties.borderStyle || 'solid'} ` +
      `${component.properties.borderColor || '#000000'}`
    ) : undefined,
    borderRadius: component.properties.borderRadius ? `${component.properties.borderRadius * scale}px` : undefined,
    cursor: isPreview ? 'default' : 'pointer',
    outline: isSelected && !isPreview ? '2px solid #3b82f6' : 'none',
    outlineOffset: isSelected && !isPreview ? '2px' : undefined,
    boxSizing: 'border-box'
  });

  const renderComponent = () => {
    const commonProps = {
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      style: getCommonStyles(),
      className: isSelected && !isPreview ? 'ring-2 ring-blue-500 ring-offset-2' : ''
    };

    switch (component.type) {
      case 'text':
        return (
          <div {...commonProps}>
            <span style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
              {component.properties.text || 'Texto'}
            </span>
          </div>
        );

      case 'heading':
        const HeadingTag = `h${component.properties.headingLevel || 1}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag {...commonProps}>
            {component.properties.text || 'Título'}
          </HeadingTag>
        );

      case 'placeholder':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundColor: component.properties.backgroundColor || '#f3f4f6',
              border: '2px dashed #9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px'
            }}
          >
            <span style={{ 
              color: '#6b7280', 
              fontSize: (12 * scale) + 'px',
              fontStyle: 'italic'
            }}>
              {component.properties.placeholderKey ? 
                `{{${component.properties.placeholderKey}}}` : 
                'Placeholder'
              }
            </span>
          </div>
        );

      case 'image':
        return (
          <div {...commonProps}>
            {component.properties.src ? (
              <img
                src={component.properties.src}
                alt={component.properties.alt || ''}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: component.properties.objectFit as any || 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f3f4f6',
                  border: '2px dashed #9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: (12 * scale) + 'px'
                }}
              >
                Imagem
              </div>
            )}
          </div>
        );

      case 'logo':
        return (
          <div {...commonProps}>
            {component.properties.src ? (
              <img
                src={component.properties.src}
                alt={component.properties.alt || 'Logo'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f3f4f6',
                  border: '2px dashed #9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: (12 * scale) + 'px'
                }}
              >
                Logo
              </div>
            )}
          </div>
        );

      case 'button':
        const buttonStyles: React.CSSProperties = {
          ...commonProps.style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isPreview ? 'pointer' : 'default',
          border: 'none',
          borderRadius: component.properties.borderRadius ? `${component.properties.borderRadius * scale}px` : '6px',
          fontWeight: 'medium',
          transition: 'all 0.2s'
        };

        // Apply button style variants
        switch (component.properties.buttonStyle) {
          case 'secondary':
            buttonStyles.backgroundColor = '#f3f4f6';
            buttonStyles.color = '#374151';
            break;
          case 'outline':
            buttonStyles.backgroundColor = 'transparent';
            buttonStyles.border = `2px solid ${component.properties.color || '#3b82f6'}`;
            buttonStyles.color = component.properties.color || '#3b82f6';
            break;
          default: // primary
            buttonStyles.backgroundColor = component.properties.backgroundColor || '#3b82f6';
            buttonStyles.color = component.properties.color || '#ffffff';
        }

        return (
          <button
            {...commonProps}
            style={buttonStyles}
            disabled={!isPreview}
          >
            {component.properties.buttonText || 'Botão'}
          </button>
        );

      case 'container':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              border: component.properties.borderWidth ? 
                commonProps.style.border : 
                (isSelected && !isPreview ? '2px dashed #3b82f6' : '1px dashed #d1d5db'),
              backgroundColor: component.properties.backgroundColor || 'transparent'
            }}
          >
            {/* Container content will be rendered by child components */}
          </div>
        );

      case 'spacer':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundColor: isSelected && !isPreview ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: isSelected && !isPreview ? '1px dashed #3b82f6' : '1px dashed #e5e7eb'
            }}
          >
            {isSelected && !isPreview && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: (10 * scale) + 'px',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }}
              >
                Espaçador
              </div>
            )}
          </div>
        );

      case 'divider':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundColor: component.properties.backgroundColor || '#e5e7eb',
              minHeight: component.properties.dividerThickness ? 
                `${component.properties.dividerThickness * scale}px` : 
                `${2 * scale}px`
            }}
          />
        );

      case 'table':
        const tableData = component.properties.tableData || {
          headers: ['Coluna 1', 'Coluna 2'],
          rows: [['Linha 1, Col 1', 'Linha 1, Col 2']]
        };

        return (
          <div {...commonProps}>
            <table
              style={{
                width: '100%',
                height: '100%',
                borderCollapse: 'collapse',
                fontSize: (component.properties.fontSize || 12) * scale + 'px'
              }}
            >
              <thead>
                <tr>
                  {tableData.headers.map((header, index) => (
                    <th
                      key={index}
                      style={{
                        border: `1px solid ${component.properties.borderColor || '#d1d5db'}`,
                        padding: `${4 * scale}px ${8 * scale}px`,
                        backgroundColor: component.properties.headerBackgroundColor || '#f9fafb',
                        textAlign: 'left',
                        fontWeight: 'semibold'
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={{
                          border: `1px solid ${component.properties.borderColor || '#d1d5db'}`,
                          padding: `${4 * scale}px ${8 * scale}px`
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'chart':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundColor: component.properties.backgroundColor || '#f9fafb',
              border: '1px solid #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                color: '#6b7280',
                fontSize: (14 * scale) + 'px',
                textAlign: 'center'
              }}
            >
              📊<br />
              Gráfico<br />
              <small style={{ fontSize: (10 * scale) + 'px' }}>
                {component.properties.chartType || 'bar'}
              </small>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundColor: component.properties.backgroundColor || 'transparent',
              border: '2px dashed #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                color: '#6b7280',
                fontSize: (12 * scale) + 'px',
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              ✍️<br />
              Área de Assinatura
            </div>
          </div>
        );

      default:
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundColor: '#fee2e2',
              border: '2px dashed #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ color: '#dc2626', fontSize: (12 * scale) + 'px' }}>
              Tipo desconhecido: {component.type}
            </span>
          </div>
        );
    }
  };

  return renderComponent();
}

// Componente para renderizar múltiplos componentes
interface TemplateRendererListProps {
  components: TemplateComponent[];
  selectedComponentId?: string;
  isPreview?: boolean;
  onComponentSelect?: (id: string) => void;
  onComponentDoubleClick?: (id: string) => void;
  scale?: number;
}

export function TemplateRendererList({
  components,
  selectedComponentId,
  isPreview = false,
  onComponentSelect,
  onComponentDoubleClick,
  scale = 1
}: TemplateRendererListProps) {
  // Ordenar componentes por zIndex para renderização correta
  const sortedComponents = [...components].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return (
    <>
      {sortedComponents.map((component) => (
        <TemplateRenderer
          key={component.id}
          component={component}
          isSelected={component.id === selectedComponentId}
          isPreview={isPreview}
          onSelect={onComponentSelect}
          onDoubleClick={onComponentDoubleClick}
          scale={scale}
        />
      ))}
    </>
  );
}