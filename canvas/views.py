from django.shortcuts import render
from rest_framework import viewsets
from .models import Drawing
from .serializers import DrawingSerializer

class DrawingViewSet(viewsets.ModelViewSet):
    queryset         = Drawing.objects.all().order_by('-created')
    serializer_class = DrawingSerializer
