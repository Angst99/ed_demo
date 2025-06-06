import requests
import json
import time
from datetime import datetime
import pandas as pd
import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36'}


def process_data():
    # 读取数据
    data = pd.read_excel("机台ed档案.xlsx", header=0, sheet_name='Sheet1')

    # 删除重量列中为 nan 的行
    filtered_df = data.dropna(subset=['重量']).reset_index(drop=True).reset_index(drop=True)

    # 填补缺失值
    filtered_df['机台号'] = filtered_df['机台号'].ffill()
    filtered_df['打印模型表面积'] = filtered_df['打印模型表面积'].ffill()
    filtered_df['打印模型体积'] = filtered_df['打印模型体积'].ffill()
    filtered_df['打印模型名称'] = filtered_df['打印模型名称'].ffill()
    filtered_df['光机类型'] = filtered_df['光机类型'].ffill()
    for i in range(len(filtered_df)):
        filtered_df['调整次数'] = filtered_df['调整次数'].fillna(filtered_df['调整次数'].shift() + 1)

    final_data = filtered_df[['机台号', 'ed值', '调整次数', '重量', '打印模型名称', '打印模型表面积', '打印模型体积', '光机类型', '备注']]
    final_data.loc[:, '重量'] = final_data['重量'].astype(str)
    final_data.loc[:, '打印模型体积'] = final_data['打印模型体积'].astype(str)
    for i in range(len(final_data)):
        if final_data.iloc[i]['打印模型表面积'] == '无':
            final_data.at[i, '打印模型体积'] = '无'
    mask = final_data['备注'].isna()
    final_data = final_data[mask].reset_index(drop=True)
    final_data = final_data[final_data['打印模型表面积']!= '无'].reset_index(drop=True)
    pattern = r'\d'
    final_data1 = final_data[final_data['重量'].str.contains(pattern, na=False)].reset_index(drop=True)
    final_data1['机台号'] = final_data1['机台号'].astype(str)
    final_data1['机台模型'] = final_data1['机台号'] + final_data1['打印模型名称']
    values = final_data1['机台模型'].value_counts(sort=False)[final_data1['机台模型'].value_counts() >= 2].index
    final_data2 = final_data1[final_data1['机台模型'].isin(values)].reset_index(drop=True)

    def data_processing(data):
        data1 = data.strip().replace('-', ' ').split(' ')
        data1 = [int(num) for num in data1]
        data2 = np.array(data1)
        data3 = round(np.mean(data2), 2)
        return data3

    final_data2['平均重量'] = final_data2['重量'].apply(lambda x: data_processing(x))
    final_data3 = final_data2[['机台号', 'ed值', '调整次数', '平均重量', '重量', '打印模型表面积', '打印模型体积', '光机类型']]
    final_data3.loc[:, '调整次数'] = final_data3['调整次数'].astype(int)
    final_data4 = pd.DataFrame(columns=['机台号', 'ed变化值', '平均重量变化值', '打印模型表面积', '打印模型体积', '光机类型'])
    for i in range(len(final_data3) - 1):
        if final_data3.iloc[i]['机台号'] == final_data3.iloc[i + 1]['机台号'] and final_data3.iloc[i + 1]['调整次数'] - final_data3.iloc[i]['调整次数'] == 1:
            ed_change_value = final_data3.iloc[i + 1]['ed值'] - final_data3.iloc[i]['ed值']
            average_weight_change_value = final_data3.iloc[i + 1]['平均重量'] - final_data3.iloc[i]['平均重量']
            final_data4.loc[len(final_data4)] = [final_data3.iloc[i]['机台号'], ed_change_value, average_weight_change_value, final_data3.iloc[i]['打印模型表面积'], final_data3.iloc[i]['打印模型体积'], final_data3.iloc[i]['光机类型']]
    final_data4['ed变化值'] = final_data4['ed变化值'].astype(float)
    final_data4['平均重量变化值'] = final_data4['平均重量变化值'].astype(float)
    final_data4['打印模型表面积'] = final_data4['打印模型表面积'].astype(float)
    final_data4['打印模型体积'] = final_data4['打印模型体积'].astype(float)
    final_data5 = final_data4.reset_index(drop=True)
    final_data5['光机类型'] = final_data5['光机类型'].sort_values()
    final_data5.sort_values(by='光机类型', inplace=True)
    final_data5.reset_index(drop=True, inplace=True)
    def deal_with_light(data):
        if data.strip() == 'A':
            return 1
        if data.strip() == 'B':
            return 2
    final_data5['光机类型2'] = final_data5['光机类型'].apply(lambda x: deal_with_light(x))
    final_data5 = final_data5[final_data5['ed变化值']!= 0].reset_index(drop=True)
    final_data5['0.1ed对应重量'] = (0.1 / final_data5['ed变化值']) * final_data5['平均重量变化值']
    a = np.mean(final_data5[final_data5['0.1ed对应重量']!= -np.inf]['0.1ed对应重量'].values)
    return final_data5, 0.1 / a


def analyze_data(final_data5, k):
    # 列之间的线性相关关系
    correlation_ab = final_data5[['平均重量变化值', 'ed变化值', '打印模型表面积', '打印模型体积', '光机类型2']].corr()
    print(correlation_ab)

    sns.pairplot(final_data5, kind="reg", diag_kind="kde")
    sns.pairplot(final_data5, hue="光机类型2")

    sns.boxplot(x='光机类型2', y='平均重量变化值', data=final_data5)
    plt.show()

    # A 光机
    matplotlib.rcParams['font.family'] = 'SimHei'
    matplotlib.rcParams['axes.unicode_minus'] = False
    plt.figure(figsize=(12, 8))
    x = final_data5[final_data5['光机类型2'] == 1]['ed变化值'].values
    y = final_data5[final_data5['光机类型2'] == 1]['平均重量变化值'].values
    plt.scatter(x, y, color='blue')
    plt.title('A 光机 ed 变化值对平均重量的影响', fontsize=20)
    plt.xlabel('ed 变化值', fontsize=16)
    plt.ylabel('平均重量变化值', fontsize=16)
    plt.show()

    # B 光机
    plt.figure(figsize=(12, 8))
    x = final_data5[final_data5['光机类型2'] == 2]['ed变化值'].values
    y = final_data5[final_data5['光机类型2'] == 2]['平均重量变化值'].values
    plt.scatter(x, y, color='blue')
    plt.title('B 光机 ed 变化值对平均重量的影响', fontsize=20)
    plt.xlabel('ed 变化值', fontsize=16)
    plt.ylabel('平均重量变化值', fontsize=16)
    plt.show()

    # 整体
    plt.figure(figsize=(12, 8))
    x = final_data5['ed变化值'].values
    y = final_data5['平均重量变化值'].values
    plt.scatter(x, y, color='blue')
    plt.title('ed 变化值对平均重量的影响', fontsize=20)
    plt.xlabel('ed 变化值', fontsize=16)
    plt.ylabel('平均重量变化值', fontsize=16)
    plt.show()

    # 线性拟合
    x = final_data5['平均重量变化值'].values
    y = final_data5['ed变化值'].values
    z = np.polyfit(x, y, 1)
    p = np.poly1d(z)
    plt.plot(x, y, 'bo', label='Original data')
    plt.plot(x, p(x), 'r', label='Linear fit')
    plt.plot(x, k * x, 'y', label='b=0')
    plt.legend()
    plt.show()


def predict_data(final_data5):
    # 忽略机台之间的差异
    X = final_data5[['ed变化值', '打印模型表面积', '打印模型体积', '光机类型2']]
    y = final_data5['平均重量变化值']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
#     print(f"Mean Squared Error: {mse}")
    score = model.score(X_test, y_test)

    # 忽略同光机类型机台自身之间的差异
    X = final_data5[['平均重量变化值', '打印模型表面积', '打印模型体积', '光机类型2']]
    y = final_data5['ed变化值']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=10)
    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
#     print(f"Mean Squared Error: {mse}")
    score = model.score(X_test, y_test)

    return model


# def predict_ed_change(new_data):
#    final_data, k = process_data()
#    model = predict_data(final_data)
#    prediction = model.predict(new_data)
#    prediction_str = json.dumps(prediction.tolist())
#    return prediction_str

def predict_ed_change(new_data):
   prediction = model.predict(new_data)
   prediction_str = json.dumps(prediction.tolist())
   return prediction_str

from flask import Flask, request

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    new_data = [[data['change'], data['area'], data['volume'], data['type']]]
    prediction = predict_ed_change(new_data)
    return prediction

if __name__ == '__main__':

    final_data, k = process_data()
    model = predict_data(final_data)
#     app.run(port=3002)
    new_data = [[20,20000,1000,2]]
    prediction = predict_ed_change(new_data)
    print(prediction)
    pass