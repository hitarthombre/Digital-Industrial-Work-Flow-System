import React from 'react';
import { useParams } from 'react-router-dom';
import ProductBuilder from './ProductBuilder';

export const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return <ProductBuilder mode="edit" initialProductId={id} />;
};

export default EditProduct;
