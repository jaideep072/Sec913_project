package mth.util;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Stores List<String> as a JSON-encoded text column.
 *
 * Lets a single column hold things like ["dystopia","politics","society"]
 * — much simpler than @ElementCollection + join tables per list field.
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

	private static final ObjectMapper MAPPER = new ObjectMapper();
	private static final TypeReference<List<String>> TYPE = new TypeReference<List<String>>() {};

	@Override
	public String convertToDatabaseColumn(List<String> attribute) {
		try {
			if (attribute == null || attribute.isEmpty()) return "[]";
			return MAPPER.writeValueAsString(attribute);
		} catch (Exception e) {
			throw new IllegalStateException("Failed to serialize list", e);
		}
	}

	@Override
	public List<String> convertToEntityAttribute(String dbData) {
		try {
			if (dbData == null || dbData.isBlank()) return new ArrayList<>();
			return MAPPER.readValue(dbData, TYPE);
		} catch (Exception e) {
			throw new IllegalStateException("Failed to deserialize list", e);
		}
	}
}
