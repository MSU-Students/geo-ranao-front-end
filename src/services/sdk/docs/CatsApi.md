# CatsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**catsControllerCreate**](#catscontrollercreate) | **POST** /cats | |
|[**catsControllerFindAll**](#catscontrollerfindall) | **GET** /cats | |

# **catsControllerCreate**
> catsControllerCreate()


### Example

```typescript
import {
    CatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CatsApi(configuration);

const { status, data } = await apiInstance.catsControllerCreate();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **catsControllerFindAll**
> catsControllerFindAll()


### Example

```typescript
import {
    CatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CatsApi(configuration);

const { status, data } = await apiInstance.catsControllerFindAll();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

