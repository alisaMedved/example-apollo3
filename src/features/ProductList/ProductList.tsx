import { useRouter } from 'next/router';
import { Table, Popconfirm } from 'antd';
import { TablePaginationConfig } from 'antd/lib/table';
import { useProductListQuery } from './__generated__/ProductListQuery';
import { useProductDeleteMutation } from 'app/features/ProductList/__generated__/ProductDeleteMutation';
import { useProductRemoveByIdMutation } from 'app/features/ProductList/__generated__/ProductRemoveByIdMutation';
import { useProductSetPriceMutation } from 'app/features/ProductList/__generated__/ProductSetPriceMutation';
import { useProductUpdateSubscription } from 'app/features/ProductList/__generated__/ProductUpdateSubscription';

export function ProductList() {
  const router = useRouter();
  const variables = {
    page: parseInt(router.query?.page as any) || 1,
    perPage: parseInt(router.query?.perPage as any) || 5,
  };

  // и просто вызываем наш хук!
  const { data, loading, error } = useProductListQuery({
    variables,
  });

  // мутация - удаление элемента
  const [removeById] = useProductRemoveByIdMutation({
    update( cashe, result) {
      // Apollo cashe бывает кастомным. И по умолчанию аполо ставит в id поле id -
      // но вы можете это переопределить с помощью identify и evict
      //суть в том что без этих двух строк приходилось каждый раз обновлять таблицу
      // чтобы посмотреть результат удаления - а тут сразу автоматически запись убирается
      const id = cashe.identify(result.data?.removeProduct.record);
      cashe.evict({id});
    }
  });

  // мутация изменения цены
  const [setPrice] = useProductSetPriceMutation();

  // подписка на обновление записи - а именно на обновление ее цены
  // зачем это? Чтобы если ты изменяешь цену в одном окне браузера -
  // в другом у тебя отобразилось изменение цены автоматически

  // но не стоит вводить много подписок
  // 1) это жуко тормозит - слишком огромная нагрузка на сервер
  // 2)бекам великая запара
  useProductUpdateSubscription();

  return (
    <Table
      title={() => <h1>Implement ProductList logic like in Orders</h1>}
      loading={loading}
      dataSource={data?.viewer?.productPagination?.items || []}
      columns={[
        {
          title: 'ProductID',
          dataIndex: 'productID',
        },
        {
          title: 'Name',
          dataIndex: 'name',
        },
        {
          title: 'Supplier',
          dataIndex: ['supplier', 'companyName'],
        },
        {
          title: 'Unit Price',
          dataIndex: 'unitPrice',
          render: (unitPrice, _record) => {
            return (<span onClick={() => {
              setPrice({
             variables: {
                _id: _record._id,
                  newUnitPrice: _record.unitPrice * 1.1
              }
            });
            }
            }>unitPrice</span>);
            // return <OrderListEditableFreight record={record} />;
          },
        },
        {
          title: 'Operations',
          width: '150px',
          render: (_t, _record) => {
            return (
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => {
                  removeById({
                    variables: { _id: _record?._id },
                  });
                }}
              >
                <a>Delete</a>
              </Popconfirm>
            );
          },
        },
      ]}
      pagination={{
        // showSizeChanger: true,
        // pageSize: variables.perPage,
        // current: variables.page,
        // pageSizeOptions: ['5', '10', '100'],
        // total: 100, // TODO: from graphql response
        // А нафига клиенту считать какую страницу прислал бек - возьмем данные с бека!
        showSizeChanger: true,
        pageSize: data?.viewer?.productPagination?.pageInfo?.perPage,
        current: data?.viewer?.productPagination?.pageInfo?.currentPage,
        pageSizeOptions: ['5', '10', '100'],
        total: data?.viewer?.productPagination?.count,
      }}
      // дада все изменения через адресную строку
      onChange={(pagination: TablePaginationConfig) => {
        router.push({
          pathname: router.pathname,
          query: {
            page: pagination.current,
            perPage: pagination.pageSize,
          },
        });
      }}
      rowKey="productID"
      rowClassName={() => 'editable-row'}
    />
  );
}